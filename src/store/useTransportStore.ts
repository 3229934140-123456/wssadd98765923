import { create } from 'zustand'
import type {
  TransportState,
  TransportInfo,
  TempRecord,
  AbnormalSegment,
  TempStatus,
  CoolerStatus,
  GoodsCategory
} from '@/types/transport'
import { getTempStatus, isAbnormal } from '@/utils/temperature'

const initialInfo: TransportInfo = {
  plateNumber: '',
  goodsCategory: 'chilled',
  goodsCategoryLabel: '冷藏品（0~4℃）',
  tempMin: 0,
  tempMax: 4,
  estimatedArrival: 0,
  startTime: null,
  endTime: null
}

const initialState: TransportState = {
  status: 'idle',
  info: initialInfo,
  currentTemp: 2,
  tempStatus: 'normal',
  coolerStatus: 'unknown',
  lastReportTime: Date.now(),
  tempRecords: [],
  abnormalSegments: [],
  activeAbnormal: null,
  driverRemark: ''
}

interface TransportStore extends TransportState {
  setPlateNumber: (plate: string) => void
  setGoodsCategory: (category: GoodsCategory, label: string) => void
  setTempRange: (min: number, max: number) => void
  setEstimatedArrival: (time: number) => void
  startTransport: () => void
  endTransport: () => void
  resetTransport: () => void
  updateTemperature: (temp: number) => void
  setCoolerStatus: (status: CoolerStatus) => void
  addAbnormalRemark: (remark: string) => void
  setDriverRemark: (remark: string) => void
}

let mockInterval: ReturnType<typeof setInterval> | null = null

function generateMockTemp(min: number, max: number, current: number): number {
  const mid = (min + max) / 2
  const volatility = (max - min) * 0.3
  const randomFactor = (Math.random() - 0.5) * volatility
  const drift = (mid - current) * 0.1
  let next = current + drift + randomFactor
  if (Math.random() < 0.08) {
    next += (Math.random() - 0.3) * volatility * 2
  }
  return Math.round(next * 10) / 10
}

export const useTransportStore = create<TransportStore>((set, get) => ({
  ...initialState,

  setPlateNumber: (plate) => set({
    info: { ...get().info, plateNumber: plate }
  }),

  setGoodsCategory: (category, label) => set({
    info: { ...get().info, goodsCategory: category, goodsCategoryLabel: label }
  }),

  setTempRange: (min, max) => set({
    info: { ...get().info, tempMin: min, tempMax: max }
  }),

  setEstimatedArrival: (time) => set({
    info: { ...get().info, estimatedArrival: time }
  }),

  startTransport: () => {
    const state = get()
    const startTime = Date.now()
    const initTemp = (state.info.tempMin + state.info.tempMax) / 2

    if (mockInterval) clearInterval(mockInterval)

    set({
      status: 'running',
      info: { ...state.info, startTime },
      currentTemp: initTemp,
      tempStatus: 'normal',
      coolerStatus: 'running',
      lastReportTime: startTime,
      tempRecords: [{
        timestamp: startTime,
        temperature: initTemp,
        status: 'normal'
      }],
      abnormalSegments: [],
      activeAbnormal: null
    })

    mockInterval = setInterval(() => {
      const s = get()
      if (s.status !== 'running') return
      const newTemp = generateMockTemp(s.info.tempMin, s.info.tempMax, s.currentTemp)
      get().updateTemperature(newTemp)
    }, 3000)
  },

  endTransport: () => {
    if (mockInterval) {
      clearInterval(mockInterval)
      mockInterval = null
    }
    const state = get()
    const endTime = Date.now()
    let finalAbnormalSegments = state.abnormalSegments
    if (state.activeAbnormal) {
      const endedAbnormal: AbnormalSegment = {
        ...state.activeAbnormal,
        endTime,
        endTemp: state.currentTemp
      }
      finalAbnormalSegments = [...finalAbnormalSegments, endedAbnormal]
    }
    set({
      status: 'finished',
      info: { ...state.info, endTime },
      coolerStatus: 'idle',
      activeAbnormal: null,
      abnormalSegments: finalAbnormalSegments
    })
  },

  resetTransport: () => {
    if (mockInterval) {
      clearInterval(mockInterval)
      mockInterval = null
    }
    set({
      ...initialState,
      info: { ...initialInfo }
    })
  },

  updateTemperature: (temp) => {
    const state = get()
    const now = Date.now()
    const newStatus: TempStatus = getTempStatus(temp, state.info.tempMin, state.info.tempMax)
    const record: TempRecord = {
      timestamp: now,
      temperature: temp,
      status: newStatus
    }
    const records = [...state.tempRecords, record].slice(-200)

    let newAbnormalSegments = state.abnormalSegments
    let newActiveAbnormal: AbnormalSegment | null = state.activeAbnormal

    if (isAbnormal(newStatus)) {
      const abnormalType = newStatus.includes('high') ? 'high' : 'low'
      if (!newActiveAbnormal) {
        newActiveAbnormal = {
          startTime: now,
          endTime: now,
          startTemp: temp,
          endTemp: temp,
          maxTemp: temp,
          minTemp: temp,
          type: abnormalType,
          handled: false,
          remark: ''
        }
      } else if (newActiveAbnormal.type === abnormalType) {
        newActiveAbnormal = {
          ...newActiveAbnormal,
          endTime: now,
          endTemp: temp,
          maxTemp: Math.max(newActiveAbnormal.maxTemp, temp),
          minTemp: Math.min(newActiveAbnormal.minTemp, temp)
        }
      } else {
        newAbnormalSegments = [...newAbnormalSegments, newActiveAbnormal]
        newActiveAbnormal = {
          startTime: now,
          endTime: now,
          startTemp: temp,
          endTemp: temp,
          maxTemp: temp,
          minTemp: temp,
          type: abnormalType,
          handled: false,
          remark: ''
        }
      }
    } else if (newActiveAbnormal) {
      newAbnormalSegments = [...newAbnormalSegments, newActiveAbnormal]
      newActiveAbnormal = null
    }

    set({
      currentTemp: temp,
      tempStatus: newStatus,
      lastReportTime: now,
      tempRecords: records,
      abnormalSegments: newAbnormalSegments,
      activeAbnormal: newActiveAbnormal
    })
  },

  setCoolerStatus: (status) => set({ coolerStatus: status }),

  addAbnormalRemark: (remark) => {
    const state = get()
    if (state.activeAbnormal) {
      set({
        activeAbnormal: {
          ...state.activeAbnormal,
          handled: true,
          remark
        }
      })
      return
    }
    const last = state.abnormalSegments[state.abnormalSegments.length - 1]
    if (last) {
      const updated = [...state.abnormalSegments]
      updated[updated.length - 1] = { ...last, handled: true, remark }
      set({ abnormalSegments: updated })
    }
  },

  setDriverRemark: (remark) => set({ driverRemark: remark })
}))
