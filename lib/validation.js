import { EPSID_RE } from "./constants";

export const isNameValid = (name) => name.trim().length > 0;
export const isPhoneValid = (phone) => phone.length === 10;
export const isEpsidValid = (epsid) => EPSID_RE.test(epsid);

export const areDetailsValid = ({ name, phone, epsid }) =>
  isNameValid(name) && isPhoneValid(phone) && isEpsidValid(epsid);

/** Field-level messages. `attempted` = the student has tried to move on at least once. */
export function detailErrors({ name, phone, epsid }, attempted) {
  return {
    name: attempted && !isNameValid(name) ? "Name is required." : "",
    phone:
      !isPhoneValid(phone) && (attempted || phone.length > 0)
        ? phone.length === 0
          ? "Phone number is required."
          : `Enter all 10 digits (you have ${phone.length}).`
        : "",
    epsid:
      !isEpsidValid(epsid) && (attempted || epsid.length > 0)
        ? epsid.length === 0
          ? "EPSID is required."
          : "Use the Correct EPSID start with 'EPS'"
        : "",
  };
}

/** One-line summary of what's still missing, for the button hint. */
export function detailsHint({ name, phone, epsid }) {
  const missing = [];
  if (!isNameValid(name)) missing.push("a name");
  if (!isPhoneValid(phone)) missing.push("a 10-digit phone number");
  if (!isEpsidValid(epsid)) missing.push("a valid EPSID");
  return missing.length ? `Please add ${missing.join(", ")}.` : "";
}
