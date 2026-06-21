import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import type { TempRecord } from '@/types/transport'
import { isWarning, isDanger, formatTemp } from '@/utils/temperature'

interface TempChartProps {
  records: TempRecord[]
  tempMin: number
  tempMax: number
}

const TempChart: React.FC<TempChartProps> = ({ records, tempMin, tempMax }) => {
  if (records.length === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无温度数据</Text>
      </View>
    )
  }

  const displayRecords = records.slice(-30)
  const padding = (tempMax - tempMin) * 0.3
  const chartMin = tempMin - padding
  const chartMax = tempMax + padding
  const range = chartMax - chartMin

  const points = displayRecords.map((r, i) => {
    const x = (i / Math.max(displayRecords.length - 1, 1)) * 100
    const y = 100 - ((r.temperature - chartMin) / range) * 100
    const color = isDanger(r.status) ? '#EF4444' : isWarning(r.status) ? '#F59E0B' : '#0EA5E9'
    return { x: `${x}%`, y: `${y}%`, color, temp: r.temperature }
  })

  const minY = 100 - ((tempMin - chartMin) / range) * 100
  const maxY = 100 - ((tempMax - chartMin) / range) * 100

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>温度趋势</Text>
        <Text className={styles.subtitle}>近 {displayRecords.length} 个采样点</Text>
      </View>

      <View className={styles.chartArea}>
        <View className={styles.yAxis}>
          <Text className={styles.yLabel}>{formatTemp(chartMax)}</Text>
          <View className={styles.yLine} style={{ top: 0 }} />
          <Text className={styles.yLabel} style={{ color: '#10B981' }}>{formatTemp(tempMax)}</Text>
          <View className={styles.yLineSafe} style={{ top: `${maxY}%` }} />
          <Text className={styles.yLabelMid}>
            {formatTemp((tempMin + tempMax) / 2)}
          </Text>
          <Text className={styles.yLabel} style={{ color: '#10B981' }}>{formatTemp(tempMin)}</Text>
          <View className={styles.yLineSafe} style={{ top: `${minY}%` }} />
          <Text className={styles.yLabel}>{formatTemp(chartMin)}</Text>
          <View className={styles.yLine} style={{ top: '100%' }} />
        </View>

        <View className={styles.chart}>
          <View className={styles.safeZone} style={{ top: `${maxY}%`, height: `${minY - maxY}%` }} />
          <View className={styles.linePath}>
            {points.map((p, i) => {
              if (i === 0) return null
              const prev = points[i - 1]
              return (
                <View
                  key={`line-${i}`}
                  className={styles.lineSeg}
                  style={{
                    left: prev.x,
                    top: prev.y,
                    width: `calc(${p.x} - ${prev.x})`,
                    height: `calc(${p.y} - ${prev.y})`,
                    borderColor: p.color
                  }}
                />
              )
            })}
          </View>
          {points.map((p, i) => (
            <View
              key={`dot-${i}`}
              className={styles.point}
              style={{
                left: p.x,
                top: p.y,
                background: p.color,
                opacity: i === points.length - 1 ? 1 : 0.7
              }}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

export default TempChart
