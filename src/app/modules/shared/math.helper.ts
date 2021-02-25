export function calculateTotalPages(total: number, size: number) {
  try {
    if (total > 0) {
      return Math.floor(total / size) + (Math.floor(total % size) == 0 ? 0 : 1);
    } else {
      return 0;
    }
  } catch {
    return 0;
  }
}
