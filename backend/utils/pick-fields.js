// Copy only the allowed fields from a request body. Passing the whole body
// to create/Object.assign would let a client set `user` (moving a record to
// another account), `_id`, or fields the server calculates itself.
// Undefined fields are skipped so a partial update leaves them untouched.
const pickFields = (body = {}, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]])
  );

export default pickFields;
