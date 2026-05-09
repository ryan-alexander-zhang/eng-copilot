export function getOptionalFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}
