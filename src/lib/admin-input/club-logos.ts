export function parseNames(formData: FormData): string[] {
  const raw = String(formData.get("names") ?? "");
  return [
    ...new Set(
      raw
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
}
