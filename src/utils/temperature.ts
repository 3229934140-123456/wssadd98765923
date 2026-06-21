import type { TempStatus, GoodsCategory, GoodsCategoryOption } from '@/types/transport'

export const GOODS_CATEGORIES: GoodsCategoryOption[] = [
  { value: 'frozen', label: '冷冻品（-18℃以下）', defaultMin: -25, defaultMax: -15 },
  { value: 'chilled', label: '冷藏品（0~4℃）', defaultMin: 0, defaultMax: 4 },
  { value: 'fresh', label: '生鲜果蔬（4~8℃）', defaultMin: 4, defaultMax: 8 },
  { value: 'medicine', label: '医药冷链（2~8℃）', defaultMin: 2, defaultMax: 8 },
  { value: 'other', label: '自定义', defaultMin: 0, defaultMax: 10 }
]

export function getTempStatus(
  temp: number,
  min: number,
  max: number
): TempStatus {
  const warningBuffer = (max - min) * 0.15
  if (temp > max) {
    return 'danger-high'
  }
  if (temp >= max - warningBuffer) {
    return 'warning-high'
  }
  if (temp < min) {
    return 'danger-low'
  }
  if (temp <= min + warningBuffer) {
    return 'warning-low'
  }
  return 'normal'
}

export function getStatusLabel(status: TempStatus): string {
  const map: Record<TempStatus, string> = {
    'normal': '温度正常',
    'warning-high': '接近上限',
    'warning-low': '接近下限',
    'danger-high': '温度超限',
    'danger-low': '温度过低'
  }
  return map[status]
}

export function isAbnormal(status: TempStatus): boolean {
  return status !== 'normal'
}

export function isWarning(status: TempStatus): boolean {
  return status === 'warning-high' || status === 'warning-low'
}

export function isDanger(status: TempStatus): boolean {
  return status === 'danger-high' || status === 'danger-low'
}

export function getCategoryByValue(value: GoodsCategory): GoodsCategoryOption | undefined {
  return GOODS_CATEGORIES.find(c => c.value === value)
}

export function formatTemp(temp: number): string {
  return temp.toFixed(1)
}

export function getTempProgress(temp: number, min: number, max: number): number {
  const range = max - min
  if (range === 0) return 50
  const progress = ((temp - min) / range) * 100
  return Math.max(0, Math.min(100, progress))
}
