import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import TempCard from '@/components/TempCard'
import StatusBadge from '@/components/StatusBadge'
import AlertModal from '@/components/AlertModal'
import TempChart from '@/components/TempChart'
import { useTransportStore } from '@/store/useTransportStore'
import { formatTemp, isWarning, isDanger } from '@/utils/temperature'
import { speakWarning, stopSpeaking } from '@/utils/speech'

function TransitPage() {
  const {
    status,
    info,
    currentTemp,
    tempStatus,
    coolerStatus,
    lastReportTime,
    tempRecords,
    abnormalSegments,
    activeAbnormal,
    endTransport,
    addAbnormalRemark
  } = useTransportStore()

  const [, setTick] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const alertedStatusRef = useRef<string>('')

  useEffect(() => {
    if (status !== 'running') return
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (status === 'running' && (isWarning(tempStatus) || isDanger(tempStatus))) {
      const key = `${tempStatus}-${Math.floor(Date.now() / 30000)}`
      if (alertedStatusRef.current !== key) {
        alertedStatusRef.current = key
        setShowAlert(true)
        speakWarning(tempStatus)
        console.log('[Transit] alert triggered', tempStatus, currentTemp)
      }
    }
    return () => {
      stopSpeaking()
    }
  }, [tempStatus, status, currentTemp])

  const isRunning = status === 'running'

  const elapsed = useMemo(() => {
    if (!info.startTime || !isRunning) return '00:00:00'
    const diff = Date.now() - info.startTime
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [info.startTime, isRunning])

  const timeSinceReport = useMemo(() => {
    if (!isRunning) return '-'
    const diff = Date.now() - lastReportTime
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return `${sec}秒前`
    const min = Math.floor(sec / 60)
    return `${min}分钟前`
  }, [lastReportTime, isRunning])

  const etaText = useMemo(() => {
    if (!info.estimatedArrival || !isRunning) return '-'
    const diff = info.estimatedArrival - Date.now()
    if (diff <= 0) return '已到达'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}小时${m}分`
  }, [info.estimatedArrival, isRunning])

  const allAbnormals = useMemo(() => {
    const result = [...abnormalSegments]
    if (activeAbnormal) {
      result.push({ ...activeAbnormal, _active: true } as any)
    }
    return result
  }, [abnormalSegments, activeAbnormal])

  const handleEndTransport = () => {
    Taro.showModal({
      title: '结束运输',
      content: '确认已到达收货点并结束本次运输？',
      confirmText: '确认结束',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          endTransport()
          Taro.switchTab({ url: '/pages/summary/index' })
        }
      }
    })
  }

  const handleQuickRemark = () => {
    Taro.showActionSheet({
      itemList: ['检查车门已关好', '已确认制冷机运行', '已调整停车位置', '联系调度说明情况'],
      success: (res) => {
        const remarks = ['检查车门已关好', '已确认制冷机运行', '已调整停车位置', '联系调度说明情况']
        addAbnormalRemark(remarks[res.tapIndex])
        Taro.showToast({ title: '已记录备注', icon: 'success' })
      }
    })
  }

  if (!isRunning) {
    return (
      <View className={styles.page}>
        <View className={styles.idleState}>
          <View className={styles.idleIcon}>🚚</View>
          <Text className={styles.idleTitle}>暂无进行中的运输</Text>
          <Text className={styles.idleDesc}>
            请先在"出车设置"页面填写运输信息并开始运输，系统将自动监控车厢温度变化。
          </Text>
          <Button
            className={styles.startLinkBtn}
            onClick={() => Taro.switchTab({ url: '/pages/setup/index' })}
          >
            去设置出车信息
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.headerBar}>
        <View className={styles.headerLeft}>
          <Text className={styles.headerTitle}>{info.plateNumber}</Text>
          <Text className={styles.headerSub}>{info.goodsCategoryLabel}</Text>
        </View>
        <View className={styles.timerBox}>
          <Text className={styles.timerLabel}>运输时长</Text>
          <Text className={styles.timerValue}>{elapsed}</Text>
        </View>
      </View>

      <View className={styles.tempSection}>
        <TempCard
          temperature={currentTemp}
          tempMin={info.tempMin}
          tempMax={info.tempMax}
          status={tempStatus}
          plateNumber={info.plateNumber}
        />
      </View>

      <View className={styles.statusRow}>
        <View className={styles.statusCard}>
          <Text className={styles.statusCardLabel}>制冷机状态</Text>
          <StatusBadge type="cooler" status={coolerStatus} size="sm" />
        </View>
        <View className={styles.statusCard}>
          <Text className={styles.statusCardLabel}>上次上报</Text>
          <Text className={styles.statusCardValue}>{timeSinceReport}</Text>
        </View>
        <View className={styles.statusCard}>
          <Text className={styles.statusCardLabel}>预计还需</Text>
          <Text className={styles.statusCardValue}>{etaText}</Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.infoCardTitle}>运输信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>发运时间</Text>
          <Text className={styles.infoValue}>
            {info.startTime ? dayjs(info.startTime).format('MM-DD HH:mm') : '-'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预计到达</Text>
          <Text className={styles.infoValue}>
            {info.estimatedArrival ? dayjs(info.estimatedArrival).format('MM-DD HH:mm') : '-'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>采样点数</Text>
          <Text className={styles.infoValue}>{tempRecords.length} 条</Text>
        </View>
      </View>

      <TempChart
        records={tempRecords}
        tempMin={info.tempMin}
        tempMax={info.tempMax}
      />

      {allAbnormals.length > 0 && (
        <View className={styles.infoCard} style={{ marginTop: 24 }}>
          <Text className={styles.infoCardTitle}>异常记录（{allAbnormals.length}次）</Text>
          <View className={styles.abnormalList}>
            {allAbnormals.slice().reverse().map((seg: any, i) => (
              <View
                key={i}
                className={classnames(styles.abnormalItem, seg.type === 'high' && styles.abnormalItemHigh, seg._active && styles.abnormalItemActive)}
              >
                <View className={styles.abnormalHeader}>
                  <View className={styles.abnormalType}>
                    {seg.type === 'high' ? '温度偏高' : '温度偏低'}
                  </View>
                  {seg._active ? (
                    <Text className={styles.abnormalActive}>进行中</Text>
                  ) : seg.handled ? (
                    <Text className={styles.abnormalHandled}>已处理</Text>
                  ) : null}
                </View>
                <Text className={styles.abnormalTime}>
                  {dayjs(seg.startTime).format('HH:mm')} - {seg._active ? '至今' : dayjs(seg.endTime).format('HH:mm')}
                  （{seg._active
                    ? Math.ceil((Date.now() - seg.startTime) / 60000)
                    : Math.ceil((seg.endTime - seg.startTime) / 60000)}分钟）
                </Text>
                <Text className={styles.abnormalTemp}>
                  {formatTemp(seg.minTemp)} ~ {formatTemp(seg.maxTemp)} ℃
                </Text>
                {seg.remark && (
                  <Text className={styles.abnormalRemark}>处理备注：{seg.remark}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {allAbnormals.length === 0 && (
        <View className={styles.infoCard} style={{ marginTop: 24 }}>
          <Text className={styles.infoCardTitle}>异常记录</Text>
          <View className={styles.emptyAbnormal}>
            <Text className={styles.emptyAbnormalText}>✓ 全程温度正常，无异常记录</Text>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <Button className={styles.markBtn} onClick={handleQuickRemark}>
          添加备注
        </Button>
        <Button className={styles.endBtn} onClick={handleEndTransport}>
          结束运输
        </Button>
      </View>

      <AlertModal
        visible={showAlert}
        status={tempStatus}
        temperature={currentTemp}
        tempMin={info.tempMin}
        tempMax={info.tempMax}
        onClose={() => setShowAlert(false)}
      />
    </View>
  )
}

export default TransitPage
