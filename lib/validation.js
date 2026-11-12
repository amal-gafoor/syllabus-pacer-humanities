export const isNameValid = (name) => name.trim().length > 0;
export const isPhoneValid = (phone) => phone.length === 10;

export const areDetailsValid = ({ name, phone }) =>
  isNameValid(name) && isPhoneValid(phone);

/** Field-level messages. `attempted` = the student has tried to move on at least once. */
export function detailErrors({ name, phone }, attempted) {
  return {
    name: attempted && !isNameValid(name) ? "Name is required." : "",
    phone:
      !isPhoneValid(phone) && (attempted || phone.length > 0)
        ? phone.length === 0
          ? "Phone number is required."
          : `Enter all 10 digits (you have ${phone.length}).`
        : "",
  };
}

/** One-line summary of what's still missing, for the button hint. */
export function detailsHint({ name, phone }) {
  const missing = [];
  if (!isNameValid(name)) missing.push("a name");
  if (!isPhoneValid(phone)) missing.push("a 10-digit phone number");
  return missing.length ? `Please add ${missing.join(", ")}.` : "";
}
