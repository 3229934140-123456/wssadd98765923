export type GoodsCategory = 'frozen' | 'chilled' | 'fresh' | 'medicine' | 'other'

export interface GoodsCategoryOption {
  value: GoodsCategory
  label: string
  defaultMin: number
  defaultMax: number
}

export type TempStatus = 'normal' | 'warning-high' | 'warning-low' | 'danger-high' | 'danger-low'

export type CoolerStatus = 'running' | 'idle' | 'error' | 'unknown'

export interface TempRecord {
  timestamp: number
  temperature: number
  status: TempStatus
}

export interface AbnormalSegment {
  startTime: number
  endTime: number
  startTemp: number
  endTemp: number
  maxTemp: number
  minTemp: number
  type: 'high' | 'low'
  handled: boolean
  remark: string
}

export interface TransportInfo {
  plateNumber: string
  goodsCategory: GoodsCategory
  goodsCategoryLabel: string
  tempMin: number
  tempMax: number
  estimatedArrival: number
  startTime: number | null
  endTime: number | null
}

export interface TransportState {
  status: 'idle' | 'running' | 'finished'
  info: TransportInfo
  currentTemp: number
  tempStatus: TempStatus
  coolerStatus: CoolerStatus
  lastReportTime: number
  tempRecords: TempRecord[]
  abnormalSegments: AbnormalSegment[]
  activeAbnormal: AbnormalSegment | null
  driverRemark: string
}
