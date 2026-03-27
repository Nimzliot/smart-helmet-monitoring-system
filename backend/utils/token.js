const crypto = require("crypto");

const encode = (input) =>
  Buffer.from(JSON.stringify(input)).toString("base64url");

const decode = (input) => JSON.parse(Buffer.from(input, "base64url").toString("utf8"));

const signToken = (payload, secret, expiresInHours = 12) => {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60;
  const body = { ...payload, exp };

  const unsignedToken = `${encode(header)}.${encode(body)}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
};

const verifyToken = (token, secret) => {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid token format");
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  if (expectedSignature !== signature) {
    throw new Error("Invalid token signature");
  }

  const payload = decode(encodedPayload);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token has expired");
  }

  return payload;
};

module.exports = {
  signToken,
  verifyToken,
};
