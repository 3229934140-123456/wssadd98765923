import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { TempStatus, CoolerStatus } from '@/types/transport'
import { getStatusLabel, isWarning, isDanger } from '@/utils/temperature'

interface StatusBadgeProps {
  type: 'temp' | 'cooler'
  status: TempStatus | CoolerStatus
  size?: 'sm' | 'md' | 'lg'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'md' }) => {
  let label = ''
  let theme = 'default'

  if (type === 'temp') {
    label = getStatusLabel(status as TempStatus)
    if (isDanger(status as TempStatus)) theme = 'danger'
    else if (isWarning(status as TempStatus)) theme = 'warning'
    else theme = 'success'
  } else {
    const map: Record<CoolerStatus, { label: string; theme: string }> = {
      'running': { label: '制冷运行中', theme: 'success' },
      'idle': { label: '制冷待机', theme: 'default' },
      'error': { label: '制冷故障', theme: 'danger' },
      'unknown': { label: '状态未知', theme: 'default' }
    }
    label = map[status as CoolerStatus].label
    theme = map[status as CoolerStatus].theme
  }

  return (
    <View className={classnames(styles.badge, styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`], styles[`theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`])}>
      <View className={styles.dot} />
      <Text className={styles.label}>{label}</Text>
    </View>
  )
}

export default StatusBadge
