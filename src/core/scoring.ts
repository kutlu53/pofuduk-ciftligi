/**
 * Puan: doğru 10; hız bonusu en çok +5 (çocuğun kendi ortalamasına göre);
 * kombo çarpanı en çok x3. Yanlış cevap puan düşürmez, yalnızca komboyu sıfırlar.
 */
export class RoundScore {
  score = 0;
  combo = 0;
  correct = 0;
  total = 0;

  get multiplier(): number {
    if (this.combo >= 6) return 3;
    if (this.combo >= 3) return 2;
    return 1;
  }

  answer(correct: boolean, rtMs: number, avgRt: number): { points: number; mult: number } {
    this.total++;
    if (!correct) {
      this.combo = 0;
      return { points: 0, mult: 1 };
    }
    this.correct++;
    this.combo++;
    const bonus = speedBonus(rtMs, avgRt);
    const mult = this.multiplier;
    const points = (10 + bonus) * mult;
    this.score += points;
    return { points, mult };
  }

  get accuracy(): number {
    return this.total === 0 ? 0 : this.correct / this.total;
  }
}

export function speedBonus(rtMs: number, avgRt: number): number {
  if (avgRt <= 0) return 2;
  const ratio = (avgRt - rtMs) / avgRt; // pozitif = ortalamadan hızlı
  return Math.max(0, Math.min(5, Math.round(ratio * 10)));
}

export function stars(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}
