const CRISIS = /\b(suicid\w*|kill (myself|me)|end (my|it all) life|end it all|self[- ]?harm|hurt myself|want to die|don'?t want to (live|be alive)|no reason to live)\b/i

export const isCrisis = (text: string) => CRISIS.test(text)

export const CRISIS_MESSAGE =
  'It sounds like you may be going through something really painful. You deserve support from a person right now. ' +
  'If you are in danger, call your local emergency number. You can find a free, confidential helpline in your country at findahelpline.com ' +
  '(in the US, call or text 988). Future Self is a reflection tool and can’t provide crisis support.'

export const DISCLAIMER =
  'Reflective coaching only — not financial, medical, legal, or psychological advice.'
