import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { formatTemp, isWarning, isDanger, getTempProgress } from '@/utils/temperature'
import type { TempStatus } from '@/types/transport'

interface TempCardProps {
  temperature: number
  tempMin: number
  tempMax: number
  status: TempStatus
  plateNumber?: string
}

const TempCard: React.FC<TempCardProps> = ({ temperature, tempMin, tempMax, status, plateNumber }) => {
  const progress = getTempProgress(temperature, tempMin, tempMax)
  const isAbnormal = isWarning(status) || isDanger(status)

  return (
    <View className={classnames(styles.card, isAbnormal && styles.cardAbnormal, isDanger(status) && styles.cardDanger)}>
      {plateNumber && (
        <View className={styles.plateRow}>
          <Text className={styles.plateLabel}>本车车牌</Text>
          <Text className={styles.plateNumber}>{plateNumber}</Text>
        </View>
      )}

      <View className={styles.tempRow}>
        <View className={styles.tempDisplay}>
          <Text className={classnames(styles.tempValue, isAbnormal && styles.tempValueAbnormal, isDanger(status) && styles.tempValueDanger)}>
            {formatTemp(temperature)}
          </Text>
          <Text className={styles.tempUnit}>℃</Text>
        </View>
        <StatusBadge type="temp" status={status} size="lg" />
      </View>

      <View className={styles.rangeRow}>
        <View className={styles.rangeInfo}>
          <Text className={styles.rangeLabel}>目标范围</Text>
          <Text className={styles.rangeValue}>{formatTemp(tempMin)} ~ {formatTemp(tempMax)} ℃</Text>
        </View>
      </View>

      <View className={styles.progressWrap}>
        <View className={styles.progressTrack}>
          <View className={styles.progressSafeZone} style={{ left: '20%', width: '60%' }} />
          <View
            className={classnames(styles.progressFill, isAbnormal && styles.progressFillAbnormal, isDanger(status) && styles.progressFillDanger)}
            style={{ width: `${progress}%` }}
          />
          <View
            className={classnames(styles.progressDot, isAbnormal && styles.progressDotAbnormal, isDanger(status) && styles.progressDotDanger)}
            style={{ left: `${progress}%` }}
          />
        </View>
        <View className={styles.progressLabels}>
          <Text className={styles.progressLabel}>{formatTemp(tempMin)}</Text>
          <Text className={styles.progressLabel}>{formatTemp((tempMin + tempMax) / 2)}</Text>
          <Text className={styles.progressLabel}>{formatTemp(tempMax)}</Text>
        </View>
      </View>
    </View>
  )
}

export default TempCard
