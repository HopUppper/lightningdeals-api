/**
 * Protocol Bridge for LightningAPI Gateway:
 * Provides bidirectional translation between Anthropic Messages API and OpenAI-compatible Chat Completions endpoints.
 *
 * Capabilities:
 * 1. Tool schema conversion (Anthropic input_schema <-> OpenAI function parameters).
 * 2. Tool choice & message history conversion (including tool_use and tool_result blocks).
 * 3. Non-streaming response conversion (OpenAI ChatCompletion -> Anthropic Message).
 * 4. Streaming SSE event transformer (OpenAI chat.completion.chunk -> Anthropic SSE lifecycle events).
 */

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, any>;
}

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * Converts Anthropic tools to OpenAI function tools.
 */
export function convertAnthropicToolsToOpenAI(tools?: any[]): OpenAITool[] | undefined {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;

  const openAiTools: OpenAITool[] = [];
  for (const t of tools) {
    if (!t || typeof t !== 'object') continue;
    const name = String(t.name || '').trim();
    if (!name) continue;

    openAiTools.push({
      type: 'function',
      function: {
        name,
        description: t.description || undefined,
        parameters: t.input_schema && typeof t.input_schema === 'object' ? t.input_schema : { type: 'object', properties: {} },
      },
    });
  }

  return openAiTools.length > 0 ? openAiTools : undefined;
}

/**
 * Converts Anthropic tool_choice to OpenAI tool_choice.
 */
export function convertAnthropicToolChoiceToOpenAI(toolChoice: any): any {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === 'string') return toolChoice;

  if (typeof toolChoice === 'object') {
    if (toolChoice.type === 'auto') return 'auto';
    if (toolChoice.type === 'any') return 'required';
    if (toolChoice.type === 'tool' && toolChoice.name) {
      return {
        type: 'function',
        function: { name: toolChoice.name },
      };
    }
  }

  return undefined;
}

/**
 * Converts Anthropic message content blocks (including tool_use and tool_result) to OpenAI message format.
 */
export function convertAnthropicMessagesToOpenAI(messages: any[], system?: any): any[] {
  const openAiMessages: any[] = [];

  // 1. Inject system message if provided
  if (system) {
    let systemText = '';
    if (typeof system === 'string') {
      systemText = system;
    } else if (Array.isArray(system)) {
      systemText = system
        .map((b: any) => (typeof b === 'string' ? b : b?.text || ''))
        .filter(Boolean)
        .join('\n');
    }
    if (systemText.trim()) {
      openAiMessages.push({ role: 'system', content: systemText });
    }
  }

  if (!Array.isArray(messages)) return openAiMessages;

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    const role = msg.role === 'assistant' ? 'assistant' : 'user';

    // If content is simple string
    if (typeof msg.content === 'string') {
      openAiMessages.push({ role, content: msg.content });
      continue;
    }

    // If content is an array of content blocks
    if (Array.isArray(msg.content)) {
      let textParts: string[] = [];
      const toolCalls: any[] = [];
      const toolResults: any[] = [];

      for (const block of msg.content) {
        if (!block) continue;
        if (typeof block === 'string') {
          textParts.push(block);
        } else if (block.type === 'text' && typeof block.text === 'string') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id || `call_${Math.random().toString(36).slice(2, 9)}`,
            type: 'function',
            function: {
              name: block.name,
              arguments: typeof block.input === 'string' ? block.input : JSON.stringify(block.input || {}),
            },
          });
        } else if (block.type === 'tool_result') {
          let resContent = '';
          if (typeof block.content === 'string') {
            resContent = block.content;
          } else if (Array.isArray(block.content)) {
            resContent = block.content
              .map((b: any) => (typeof b === 'string' ? b : b?.text || JSON.stringify(b)))
              .join('\n');
          } else {
            resContent = JSON.stringify(block.content || '');
          }
          toolResults.push({
            role: 'tool',
            tool_call_id: block.tool_use_id,
            content: resContent,
          });
        }
      }

      // If this was an assistant message with tool calls
      if (role === 'assistant' && toolCalls.length > 0) {
        const assistantMsg: any = {
          role: 'assistant',
          content: textParts.join('\n') || null,
          tool_calls: toolCalls,
        };
        openAiMessages.push(assistantMsg);
      } else if (textParts.length > 0) {
        openAiMessages.push({
          role,
          content: textParts.join('\n'),
        });
      }

      // If user message contained tool results, emit them as separate tool role messages
      if (toolResults.length > 0) {
        openAiMessages.push(...toolResults);
      }
    }
  }

  return openAiMessages;
}

/**
 * Maps OpenAI finish_reason to Anthropic stop_reason.
 */
export function mapOpenAIFinishReasonToAnthropic(finishReason?: string | null): string {
  if (!finishReason) return 'end_turn';
  switch (finishReason.toLowerCase()) {
    case 'stop':
      return 'end_turn';
    case 'length':
      return 'max_tokens';
    case 'tool_calls':
    case 'function_call':
      return 'tool_use';
    case 'content_filter':
      return 'stop_sequence';
    default:
      return 'end_turn';
  }
}

/**
 * Converts a non-streaming OpenAI Chat Completion response to an Anthropic Message response.
 */
export function convertOpenAIResponseToAnthropic(openAiJson: any, targetModel: string): any {
  if (!openAiJson || typeof openAiJson !== 'object') {
    return {
      id: `msg_${Math.random().toString(36).slice(2, 10)}`,
      type: 'message',
      role: 'assistant',
      model: targetModel,
      content: [{ type: 'text', text: '' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }

  const rawId = openAiJson.id || `msg_${Math.random().toString(36).slice(2, 10)}`;
  const messageId = rawId.startsWith('msg_') ? rawId : `msg_${rawId}`;
  const choice = Array.isArray(openAiJson.choices) && openAiJson.choices.length > 0 ? openAiJson.choices[0] : null;
  const message = choice?.message || {};

  const content: any[] = [];

  // Text content
  if (message.content && typeof message.content === 'string') {
    content.push({
      type: 'text',
      text: message.content,
    });
  }

  // Tool calls
  if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    for (const tc of message.tool_calls) {
      if (!tc || typeof tc !== 'object') continue;
      let parsedArgs = {};
      try {
        if (typeof tc.function?.arguments === 'string') {
          parsedArgs = JSON.parse(tc.function.arguments);
        } else if (typeof tc.function?.arguments === 'object') {
          parsedArgs = tc.function.arguments;
        }
      } catch {
        parsedArgs = { raw: tc.function?.arguments };
      }

      content.push({
        type: 'tool_use',
        id: tc.id || `toolu_${Math.random().toString(36).slice(2, 10)}`,
        name: tc.function?.name || 'unknown_tool',
        input: parsedArgs,
      });
    }
  }

  // Ensure at least one content block is present
  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }

  const stopReason = mapOpenAIFinishReasonToAnthropic(choice?.finish_reason);

  const promptTokens = Number(openAiJson.usage?.prompt_tokens || 0);
  const completionTokens = Number(openAiJson.usage?.completion_tokens || 0);

  return {
    id: messageId,
    type: 'message',
    role: 'assistant',
    model: targetModel,
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: promptTokens,
      output_tokens: completionTokens,
    },
  };
}

/**
 * Stream Transformer: Translates OpenAI SSE chunks into standard Anthropic SSE events.
 */
export class OpenAIToAnthropicStreamTransformer {
  private targetModel: string;
  private messageId: string;
  private isStarted = false;
  private isContentBlockStarted = false;
  private isFinished = false;
  private activeToolCallIndex = -1;
  private currentBlockIndex = 0;
  private totalStreamedText = '';
  private reportedInputTokens: number | null = null;
  private reportedOutputTokens: number | null = null;
  private finalStopReason = 'end_turn';

  constructor(targetModel: string, customMessageId?: string) {
    this.targetModel = targetModel;
    this.messageId = customMessageId || `msg_${Math.random().toString(36).slice(2, 14)}`;
    if (!this.messageId.startsWith('msg_')) {
      this.messageId = `msg_${this.messageId}`;
    }
  }

  /**
   * Processes a single parsed JSON chunk from an OpenAI SSE stream.
   * Returns an array of formatted SSE event strings ready to write to the HTTP response.
   */
  processChunk(chunk: any): string[] {
    if (this.isFinished || !chunk || typeof chunk !== 'object') {
      return [];
    }

    const events: string[] = [];

    // Extract ID if provided on chunk
    if (!this.isStarted && chunk.id) {
      const candidateId = String(chunk.id);
      this.messageId = candidateId.startsWith('msg_') ? candidateId : `msg_${candidateId}`;
    }

    // 1. Emit message_start on the very first chunk
    if (!this.isStarted) {
      this.isStarted = true;
      const initialUsage = {
        input_tokens: this.reportedInputTokens || 0,
        output_tokens: 0,
      };

      events.push(
        `event: message_start\ndata: ${JSON.stringify({
          type: 'message_start',
          message: {
            id: this.messageId,
            type: 'message',
            role: 'assistant',
            model: this.targetModel,
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: initialUsage,
          },
        })}\n\n`
      );
    }

    // Extract choices
    const choice = Array.isArray(chunk.choices) && chunk.choices.length > 0 ? chunk.choices[0] : null;
    const delta = choice?.delta;

    // Check usage if supplied by upstream stream chunk
    if (chunk.usage) {
      if (typeof chunk.usage.prompt_tokens === 'number') {
        this.reportedInputTokens = chunk.usage.prompt_tokens;
      }
      if (typeof chunk.usage.completion_tokens === 'number') {
        this.reportedOutputTokens = chunk.usage.completion_tokens;
      }
    }

    // Check finish_reason
    if (choice?.finish_reason) {
      this.finalStopReason = mapOpenAIFinishReasonToAnthropic(choice.finish_reason);
    }

    // 2. Handle Text Delta
    if (delta && typeof delta.content === 'string' && delta.content.length > 0) {
      // Start text content block if not already started
      if (!this.isContentBlockStarted) {
        this.isContentBlockStarted = true;
        events.push(
          `event: content_block_start\ndata: ${JSON.stringify({
            type: 'content_block_start',
            index: this.currentBlockIndex,
            content_block: { type: 'text', text: '' },
          })}\n\n`
        );
      }

      this.totalStreamedText += delta.content;
      events.push(
        `event: content_block_delta\ndata: ${JSON.stringify({
          type: 'content_block_delta',
          index: this.currentBlockIndex,
          delta: { type: 'text_delta', text: delta.content },
        })}\n\n`
      );
    }

    // 3. Handle Tool Call Deltas (if supported in stream)
    if (delta && Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
      for (const tc of delta.tool_calls) {
        if (tc.index !== undefined && tc.index !== this.activeToolCallIndex) {
          // If a text block was open, close it
          if (this.isContentBlockStarted) {
            events.push(
              `event: content_block_stop\ndata: ${JSON.stringify({
                type: 'content_block_stop',
                index: this.currentBlockIndex,
              })}\n\n`
            );
            this.isContentBlockStarted = false;
            this.currentBlockIndex++;
          }

          // Start tool block
          this.activeToolCallIndex = tc.index;
          events.push(
            `event: content_block_start\ndata: ${JSON.stringify({
              type: 'content_block_start',
              index: this.currentBlockIndex,
              content_block: {
                type: 'tool_use',
                id: tc.id || `toolu_${Math.random().toString(36).slice(2, 9)}`,
                name: tc.function?.name || '',
                input: {},
              },
            })}\n\n`
          );
        }

        // Arguments delta
        if (tc.function?.arguments) {
          events.push(
            `event: content_block_delta\ndata: ${JSON.stringify({
              type: 'content_block_delta',
              index: this.currentBlockIndex,
              delta: {
                type: 'input_json_delta',
                partial_json: tc.function.arguments,
              },
            })}\n\n`
          );
        }
      }
    }

    return events;
  }

  /**
   * Completes the stream on [DONE] or EOF.
   * Emits content_block_stop, message_delta, and message_stop.
   * Guaranteed to execute at most once.
   */
  finish(fallbackUsage?: { inputTokens: number; outputTokens: number }): string[] {
    if (this.isFinished) return [];
    this.isFinished = true;

    const events: string[] = [];

    // Ensure initial message_start was sent even on empty stream
    if (!this.isStarted) {
      this.isStarted = true;
      events.push(
        `event: message_start\ndata: ${JSON.stringify({
          type: 'message_start',
          message: {
            id: this.messageId,
            type: 'message',
            role: 'assistant',
            model: this.targetModel,
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: fallbackUsage?.inputTokens || 0, output_tokens: 0 },
          },
        })}\n\n`
      );
    }

    // Close open content block
    if (this.isContentBlockStarted || this.activeToolCallIndex >= 0) {
      events.push(
        `event: content_block_stop\ndata: ${JSON.stringify({
          type: 'content_block_stop',
          index: this.currentBlockIndex,
        })}\n\n`
      );
      this.isContentBlockStarted = false;
      this.activeToolCallIndex = -1;
    }

    // Determine final output tokens
    const finalOutputTokens =
      this.reportedOutputTokens !== null && this.reportedOutputTokens > 0
        ? this.reportedOutputTokens
        : fallbackUsage?.outputTokens !== undefined
          ? fallbackUsage.outputTokens
          : Math.max(1, Math.ceil(this.totalStreamedText.length / 3.8));

    // Emit message_delta
    events.push(
      `event: message_delta\ndata: ${JSON.stringify({
        type: 'message_delta',
        delta: {
          stop_reason: this.finalStopReason,
          stop_sequence: null,
        },
        usage: {
          output_tokens: finalOutputTokens,
        },
      })}\n\n`
    );

    // Emit message_stop
    events.push(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);

    return events;
  }

  getStreamedText(): string {
    return this.totalStreamedText;
  }

  getReportedTokens(): { inputTokens: number | null; outputTokens: number | null } {
    return {
      inputTokens: this.reportedInputTokens,
      outputTokens: this.reportedOutputTokens,
    };
  }

  getMessageId(): string {
    return this.messageId;
  }
}
