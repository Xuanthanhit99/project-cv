export interface typeMailOtp {
  to: string,
  cc: string,
  otp: string
}

export const templateMailOtp = ({to, cc, otp}: typeMailOtp) => {
  return {
    from: "Nodemailer <example@nodemailer.com>",
  to: to,
  subject: cc,
  text: "For clients with plaintext support only",
  html: "<p>For clients that do not support AMP4EMAIL or when AMP content is invalid</p>",
  amp: `<!doctype html>
    <html ⚡4email>
      <head>
        <meta charset="utf-8">
        <style amp4email-boilerplate>body{visibility:hidden}</style>
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
      </head>
      <body>
        <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
        <p>OTP : ${otp}</p>
      </body>
    </html>`,
  }
};