import React, { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { TempStatus } from '@/types/transport'
import { isWarning, isDanger, getStatusLabel, formatTemp } from '@/utils/temperature'

interface AlertModalProps {
  visible: boolean
  status: TempStatus
  temperature: number
  tempMin: number
  tempMax: number
  onClose: () => void
}

const TIPS: Record<string, string[]> = {
  'warning-high': ['请检查车厢门是否关好', '确认制冷机油量是否充足', '查看停车环境是否暴晒'],
  'warning-low': ['检查温度传感器是否正常', '确认制冷机设定是否偏低', '避免长时间开启强冷模式'],
  'danger-high': ['立即停车检查车厢密封性', '确认制冷机是否正常运行', '必要时联系调度说明情况'],
  'danger-low': ['立即调节制冷机设定温度', '检查温控系统是否故障', '防止货品冻坏造成损失']
}

const AlertModal: React.FC<AlertModalProps> = ({ visible, status, temperature, tempMin, tempMax, onClose }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      try {
        Taro.vibrateLong({})
      } catch (e) {
        console.warn('[AlertModal] vibrate failed', e)
      }
      const key = status
      const tips = TIPS[key] || TIPS['warning-high']
      const label = getStatusLabel(status)
      try {
        Taro.showToast({
          title: `${label}：${formatTemp(temperature)}℃`,
          icon: 'none',
          duration: 2000
        })
      } catch (e) {
        console.warn('[AlertModal] toast failed', e)
      }
      console.log('[AlertModal] triggered', { status, temperature, tips: tips[0] })
    } else {
      setShow(false)
    }
  }, [visible, status, temperature, tempMin, tempMax])

  if (!show) return null

  const tips = TIPS[status] || TIPS['warning-high']
  const isDangerLevel = isDanger(status)
  const isWarningLevel = isWarning(status)

  return (
    <View className={styles.mask}>
      <View className={classnames(styles.modal, isDangerLevel && styles.modalDanger, isWarningLevel && styles.modalWarning)}>
        <View className={styles.alertIcon}>
          <Text className={styles.alertIconText}>!</Text>
        </View>

        <Text className={styles.alertTitle}>
          {getStatusLabel(status)}
        </Text>

        <View className={styles.tempDisplay}>
          <Text className={classnames(styles.tempValue, isDangerLevel && styles.tempDanger, isWarningLevel && styles.tempWarning)}>
            {formatTemp(temperature)}
          </Text>
          <Text className={styles.tempUnit}>℃</Text>
        </View>

        <View className={styles.rangeInfo}>
          <Text className={styles.rangeText}>目标范围：{formatTemp(tempMin)} ~ {formatTemp(tempMax)} ℃</Text>
        </View>

        <View className={styles.tipsSection}>
          <Text className={styles.tipsTitle}>请立即检查：</Text>
          {tips.map((tip, i) => (
            <View key={i} className={styles.tipItem}>
              <Text className={styles.tipIndex}>{i + 1}</Text>
              <Text className={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <Button
          className={classnames(styles.confirmBtn, isDangerLevel && styles.btnDanger, isWarningLevel && styles.btnWarning)}
          onClick={onClose}
        >
          我已知晓，立即处理
        </Button>
      </View>
    </View>
  )
}

export default AlertModal
