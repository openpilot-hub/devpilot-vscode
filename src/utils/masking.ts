
export function maskSensitiveData(data: string, paddingFromBothSide: number = 3): string {
  if (data.length <= paddingFromBothSide * 2) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, paddingFromBothSide) + '*'.repeat(data.length - paddingFromBothSide * 2) + data.slice(data.length - paddingFromBothSide);
}