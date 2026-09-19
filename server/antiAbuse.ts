import dns from 'dns';

/**
 * Top known disposable, burner, and temporary email domains
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'emailvanish.com',
  'duidir.com',
  'jqrvlhc.com',
  'webmail.com.ru',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempail.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.me',
  'dispostable.com',
  'getairmail.com',
  'burnermail.io',
  'mytemp.email',
  'nada.ltd',
  'inboxkitten.com',
  'fakemailgenerator.com',
  'zillamail.com',
  'crazymailing.com',
  'mohmal.com',
  'maildrop.cc',
  'inboxbear.com',
  'generator.email',
  'emailondeck.com',
  'tempr.email',
  'discard.email',
  'fakeinbox.com',
  'spambox.us',
  'mintemail.com',
  'mailcatch.com',
  'meltmail.com',
  'harakirimail.com',
  'incognitoid.com',
  'safetymail.info',
  'mailnesia.com',
  'mailnull.com',
  'trash-mail.com',
  'anonymousemail.me',
  'tempinbox.com',
  'getnada.com',
  'abv.bg',
  'boximail.com',
  'clipmail.eu',
  'deadaddress.com',
  'disposablemail.com',
  'dumpmail.de',
  'e4ward.com',
  'emailproxsy.com',
  'emailsensei.com',
  'emailtemporaneo.net',
  'emkei.cz',
  'evopirates.com',
  'filzmail.com',
  'fixmail.tk',
  'gishpuppy.com',
  'hidemail.de',
  'hmamail.com',
  'instantemailaddress.com',
  'jetable.org',
  'kasmail.com',
  'mail-temporaire.fr',
  'mailcatch.com',
  'mailde.de',
  'maildu.de',
  'maileater.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailfreeonline.com',
  'mailin8r.com',
  'mailmoat.com',
  'mailnator.com',
  'mailseal.de',
  'mailspeed.ru',
  'mailtemporaire.com',
  'mailtothis.com',
  'mytrashmail.com',
  'nobulk.com',
  'noclickemail.com',
  'nospam4.us',
  'nospamfor.us',
  'nowmymail.com',
  'objectmail.com',
  'oneoffmail.com',
  'onewaymail.com',
  'ourklip.com',
  'owlpic.com',
  'pookmail.com',
  'privacy.net',
  'proxymail.eu',
  'rcpt.at',
  'reallymymail.com',
  'recursor.net',
  'regbypass.com',
  'rejectmail.com',
  'rppkn.com',
  'safersignup.de',
  'safetymail.info',
  'safetypost.de',
  'sandviks.com',
  'saynotospams.com',
  'schafmail.de',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'sharedmailbox.org',
  'shiftmail.com',
  'shortmail.net',
  'sinnlos-mail.de',
  'slopsbox.com',
  'smellfear.com',
  'sneakemail.com',
  'snkmail.com',
  'sofort-mail.de',
  'sogetthis.com',
  'soodonims.com',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spameater.org',
  'spamex.com',
  'spamfree24.org',
  'spamhole.com',
  'spamify.com',
  'spaminator.de',
  'spamkill.info',
  'spammotel.com',
  'spamspot.com',
  'spamstack.net',
  'spamtrap.ro',
  'spamevader.com',
  'superstachel.de',
  'suremail.info',
  'tafmail.com',
  'teewars.org',
  'teleworm.com',
  'teleworm.us',
  'temp-mail.ru',
  'tempemail.co.za',
  'tempemail.com',
  'tempemail.net',
  'tempinbox.co.uk',
  'tempinbox.com',
  'tempmail.eu',
  'tempmail.net',
  'tempmail2.com',
  'temporaryemail.net',
  'temporaryforwarding.com',
  'temporaryinbox.com',
  'tempm.com',
  'throwawayemailaddress.com',
  'tikikiti.com',
  'tmail.ws',
  'trash-mail.at',
  'trash-me.com',
  'trashcanmail.com',
  'trashmail.at',
  'trashmailer.com',
  'trashymail.com',
  'trbvm.com',
  'twinmail.de',
  'tyldd.com',
  'uggsrock.com',
  'uplog.org',
  'valemail.net',
  'veryrealemail.com',
  'vidavee.com',
  'vpmail.de',
  'vpn.cc',
  'vubomail.com',
  'walala.org',
  'warprecords.com',
  'warpmail.net',
  'wegwerfadresse.de',
  'wegwerfemail.de',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whyspam.me',
  'willselfdestruct.com',
  'winemaven.in',
  'wuzup.net',
  'wuzupmail.net',
  'wwwnew.eu',
  'xagloo.com',
  'xents.com',
  'xmaily.com',
  'xoxy.net',
  'yep.it',
  'yogamaven.com',
  'ypmail.webcam',
  'zehnminutenmail.de',
  'zippymail.info',
  'zoemail.org',
]);

/**
 * Suspicious domain keyword patterns commonly used in disposable/burner domains
 */
const DISPOSABLE_KEYWORD_PATTERNS = [
  /temp.*mail/i,
  /mail.*temp/i,
  /dispos.*mail/i,
  /burner.*mail/i,
  /fake.*mail/i,
  /trash.*mail/i,
  /throw.*away/i,
  /10.*minute/i,
  /guerrilla/i,
  /mailinator/i,
  /vanish/i,
  /sharklasers/i,
  /inbox.*kitten/i,
  /getairmail/i,
  /yopmail/i,
  /dropmail/i,
  /discard/i,
  /spam.*box/i,
  /spameater/i,
  /spamgourmet/i,
];

/**
 * Known legitimate email providers that must NEVER be falsely blocked
 */
const TRUSTED_LEGITIMATE_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'ymail.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zohomail.com',
  'aol.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'fastmail.com',
  'tutanota.com',
  'tuta.com',
  'hey.com',
]);

/**
 * Evaluates whether an email domain is disposable, burner, or suspicious
 */
export async function isDisposableOrBurnerEmail(email: string): Promise<{ isDisposable: boolean; reason?: string }> {
  if (!email || !email.includes('@')) {
    return { isDisposable: true, reason: 'Invalid email address.' };
  }

  const domain = email.split('@')[1].trim().toLowerCase();

  // 1. Instant pass for established major domains
  if (TRUSTED_LEGITIMATE_DOMAINS.has(domain)) {
    return { isDisposable: false };
  }

  // 2. Direct match against known disposable domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isDisposable: true,
      reason: `The email provider "@${domain}" is a known temporary/disposable mail service. Please use a permanent email address (such as Gmail, Outlook, iCloud, or custom domain).`,
    };
  }

  // 3. Heuristic pattern match on domain name
  for (const pattern of DISPOSABLE_KEYWORD_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        isDisposable: true,
        reason: `The email domain "@${domain}" is classified as a temporary/throwaway email service. Please provide a standard email address.`,
      };
    }
  }

  // 4. Random alphanumeric subdomain detection (e.g. random generated bot subdomains)
  const parts = domain.split('.');
  if (parts.length > 2 && /^[a-z0-9]{8,}$/.test(parts[0])) {
    return {
      isDisposable: true,
      reason: `Suspicious auto-generated domain "@${domain}". Please use a valid personal or company email address.`,
    };
  }

  // 5. MX Record Examination for Disposable Footprints
  try {
    const timeoutPromise = new Promise<dns.MxRecord[]>((resolve) => setTimeout(() => resolve([]), 2500));
    const mxPromise = dns.promises.resolveMx(domain);
    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);

    if (mxRecords && mxRecords.length > 0) {
      for (const record of mxRecords) {
        const exchange = (record.exchange || '').toLowerCase();
        for (const pattern of DISPOSABLE_KEYWORD_PATTERNS) {
          if (pattern.test(exchange)) {
            return {
              isDisposable: true,
              reason: `The mail server for "@${domain}" is hosted on a temporary email exchange (${exchange}). Please use a legitimate email provider.`,
            };
          }
        }
      }
    }
  } catch (e) {
    // If DNS query fails, rely on static blocklist to avoid blocking legitimate edge domains
  }

  return { isDisposable: false };
}

/**
 * Synchronously checks if a domain matches known disposable lists or patterns (ideal for batch scanning)
 */
export function isDisposableDomain(domain: string): boolean {
  if (!domain) return false;
  const cleanDomain = domain.trim().toLowerCase();
  if (TRUSTED_LEGITIMATE_DOMAINS.has(cleanDomain)) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(cleanDomain)) return true;
  for (const pattern of DISPOSABLE_KEYWORD_PATTERNS) {
    if (pattern.test(cleanDomain)) return true;
  }
  const parts = cleanDomain.split('.');
  if (parts.length > 2 && /^[a-z0-9]{8,}$/.test(parts[0])) return true;
  return false;
}

/**
 * Extracts subnet prefix (/24 for IPv4, /64 for IPv6) for subnet rate-limiting
 */
export function getSubnetPrefix(ip: string): string {
  if (!ip) return '';
  const cleanIp = ip.split(',')[0].trim();
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return '';
  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.');
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.`;
    }
  } else if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:`;
    }
  }
  return cleanIp;
}
