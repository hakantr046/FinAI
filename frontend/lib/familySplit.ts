export interface FamilySplitShare {
  name: string;
  share: number;
}

export function calculateFamilySplit(totalBill: number, membersCsv: string): FamilySplitShare[] {
  const memberList = membersCsv
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  if (memberList.length === 0 || totalBill <= 0) return [];

  const perPerson = Math.round((totalBill / memberList.length) * 100) / 100;
  return memberList.map((m) => ({ name: m, share: perPerson }));
}
