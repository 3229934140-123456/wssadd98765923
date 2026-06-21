import React, { useMemo, useState } from 'react'
import { View, Text, Button, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useTransportStore } from '@/store/useTransportStore'
import { formatTemp } from '@/utils/temperature'
import TempChart from '@/components/TempChart'

function SummaryPage() {
  const {
    status,
    info,
    tempRecords,
    abnormalSegments,
    driverRemark,
    setDriverRemark,
    resetTransport
  } = useTransportStore()

  const [generated, setGenerated] = useState(false)

  const stats = useMemo(() => {
    if (tempRecords.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 }
    }
    const temps = tempRecords.map(r => r.temperature)
    const min = Math.min(...temps)
    const max = Math.max(...temps)
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length
    return { min, max, avg, count: temps.length }
  }, [tempRecords])

  const durationText = useMemo(() => {
    if (!info.startTime || !info.endTime) return '-'
    const diff = info.endTime - info.startTime
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}小时${m}分钟`
  }, [info.startTime, info.endTime])

  const abnormalTotalDuration = useMemo(() => {
    if (abnormalSegments.length === 0) return 0
    return abnormalSegments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0)
  }, [abnormalSegments])

  const abnormalMinutes = Math.ceil(abnormalTotalDuration / 60000)

  const reportNo = useMemo(() => {
    if (!info.startTime) return ''
    return `TMP${dayjs(info.startTime).format('YYYYMMDDHHmmss')}`
  }, [info.startTime])

  const verdict = useMemo(() => {
    if (abnormalSegments.length === 0) return { level: 'normal', text: '全程温度达标' }
    if (abnormalMinutes < 10) return { level: 'warning', text: '存在短时温度波动' }
    return { level: 'danger', text: '存在温度异常记录' }
  }, [abnormalSegments, abnormalMinutes])

  const hasData = status === 'finished' || (status === 'running' && tempRecords.length > 0)

  const handleGenerate = () => {
    if (!hasData) {
      Taro.showToast({ title: '暂无运输数据', icon: 'none' })
      return
    }
    setGenerated(true)
    Taro.vibrateShort({})
    Taro.showToast({ title: '温度报告已生成', icon: 'success' })
    console.log('[Summary] report generated', {
      reportNo,
      plate: info.plateNumber,
      abnormalCount: abnormalSegments.length
    })
  }

  const handleNewTrip = () => {
    Taro.showModal({
      title: '开始新运输',
      content: '将清除当前报告数据，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          resetTransport()
          setGenerated(false)
          Taro.switchTab({ url: '/pages/setup/index' })
        }
      }
    })
  }

  if (!hasData) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📋</View>
          <Text className={styles.emptyTitle}>暂无运输报告</Text>
          <Text className={styles.emptyDesc}>
            完成一次运输任务后，可在此查看本趟温度摘要报告，供仓库收货员核验。
          </Text>
          <Button
            className={styles.primaryBtn}
            onClick={() => Taro.switchTab({ url: '/pages/setup/index' })}
          >
            去创建运输任务
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.headerSection}>
        <Text className={styles.reportTitle}>冷链运输温度报告</Text>
        <Text className={styles.reportSubtitle}>{info.plateNumber} · {info.goodsCategoryLabel}</Text>
        <View className={styles.reportNo}>报告编号：{reportNo}</View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleDot} />
          <Text>运输基本信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>车辆牌照</Text>
            <Text className={styles.infoItemValue}>{info.plateNumber}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>货品类别</Text>
            <Text className={styles.infoItemValue}>{info.goodsCategoryLabel.split('（')[0]}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>发运时间</Text>
            <Text className={styles.infoItemValue}>
              {info.startTime ? dayjs(info.startTime).format('MM-DD HH:mm') : '-'}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>到达时间</Text>
            <Text className={styles.infoItemValue}>
              {info.endTime ? dayjs(info.endTime).format('MM-DD HH:mm') : '运输中'}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>运输时长</Text>
            <Text className={styles.infoItemValue}>{durationText}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoItemLabel}>采样点数</Text>
            <Text className={styles.infoItemValue}>{stats.count} 条</Text>
          </View>
          <View className={styles.infoItemFull}>
            <Text className={styles.infoItemLabel}>目标温度范围</Text>
            <Text className={styles.infoItemValue}>{formatTemp(info.tempMin)} ~ {formatTemp(info.tempMax)} ℃</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleDot} />
          <Text>温度统计</Text>
        </View>
        <View className={styles.statsRow}>
          <View className={classnames(styles.statCard, styles.statCardMin)}>
            <Text className={styles.statValue}>
              {formatTemp(stats.min)}<Text className={styles.statUnit}>℃</Text>
            </Text>
            <Text className={styles.statLabel}>最低温度</Text>
          </View>
          <View className={classnames(styles.statCard, styles.statCardAvg)}>
            <Text className={styles.statValue}>
              {formatTemp(stats.avg)}<Text className={styles.statUnit}>℃</Text>
            </Text>
            <Text className={styles.statLabel}>平均温度</Text>
          </View>
          <View className={classnames(styles.statCard, styles.statCardMax)}>
            <Text className={styles.statValue}>
              {formatTemp(stats.max)}<Text className={styles.statUnit}>℃</Text>
            </Text>
            <Text className={styles.statLabel}>最高温度</Text>
          </View>
        </View>

        <TempChart
          records={tempRecords}
          tempMin={info.tempMin}
          tempMax={info.tempMax}
        />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleDot} />
          <Text>异常情况</Text>
        </View>

        <View className={classnames(
          styles.abnormalSummary,
          verdict.level === 'warning' && styles.abnormalSummaryWarn,
          verdict.level === 'danger' && styles.abnormalSummaryDanger
        )}>
          <View className={styles.abnormalCount}>{abnormalSegments.length}</View>
          <View className={styles.abnormalText}>
            <Text className={styles.abnormalTextMain}>{verdict.text}</Text>
            <Text className={styles.abnormalTextSub}>
              {abnormalSegments.length === 0
                ? '运输全程温度均在目标范围内，货品品质有保障'
                : `共 ${abnormalSegments.length} 次异常，累计约 ${abnormalMinutes} 分钟`}
            </Text>
          </View>
        </View>

        {abnormalSegments.length > 0 && (
          <View className={styles.abnormalList}>
            {abnormalSegments.map((seg, i) => (
              <View
                key={i}
                className={classnames(styles.abnormalItem, seg.type === 'high' && styles.abnormalItemHigh)}
              >
                <View className={styles.abnormalHeader}>
                  <View className={styles.abnormalTypeTag}>
                    第{i + 1}次 · {seg.type === 'high' ? '温度偏高' : '温度偏低'}
                  </View>
                  <Text className={styles.abnormalDuration}>
                    {Math.ceil((seg.endTime - seg.startTime) / 60000)}分钟
                  </Text>
                </View>
                <View className={styles.abnormalBody}>
                  <View className={styles.abnormalRow}>
                    <Text className={styles.abnormalRowLabel}>时段</Text>
                    <Text className={styles.abnormalRowValue}>
                      {dayjs(seg.startTime).format('HH:mm')} - {dayjs(seg.endTime).format('HH:mm')}
                    </Text>
                  </View>
                  <View className={styles.abnormalRow}>
                    <Text className={styles.abnormalRowLabel}>温度区间</Text>
                    <Text className={styles.abnormalRowValue}>
                      {formatTemp(seg.minTemp)} ~ {formatTemp(seg.maxTemp)} ℃
                    </Text>
                  </View>
                  <View className={styles.abnormalRow}>
                    <Text className={styles.abnormalRowLabel}>峰值温度</Text>
                    <Text className={styles.abnormalRowValue}>
                      {seg.type === 'high' ? formatTemp(seg.maxTemp) : formatTemp(seg.minTemp)} ℃
                    </Text>
                  </View>
                </View>
                {seg.remark && (
                  <View className={styles.abnormalRemarkBox}>
                    <Text className={styles.abnormalRemarkLabel}>司机处理备注</Text>
                    <Text className={styles.abnormalRemarkText}>✓ {seg.remark}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleDot} />
          <Text>司机备注</Text>
        </View>
        <Textarea
          className={styles.remarkInput}
          placeholder="如有需要补充的运输情况，请在此填写（选填）"
          placeholderStyle="color: #94A3B8"
          value={driverRemark}
          maxlength={200}
          onInput={(e) => setDriverRemark(e.detail.value)}
        />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleDot} />
          <Text>交接确认</Text>
        </View>
        <View className={styles.signArea}>
          <View className={styles.signBox}>
            <Text className={styles.signLabel}>司机签字</Text>
            <Text className={styles.signValue}>{generated ? info.plateNumber + ' 司机' : '—'}</Text>
            <Text className={styles.signDate}>
              {generated ? dayjs(info.endTime || Date.now()).format('YYYY-MM-DD') : ''}
            </Text>
          </View>
          <View className={styles.signBox}>
            <Text className={styles.signLabel}>收货员签字</Text>
            <Text className={styles.signValue}>{generated ? '仓库核验' : '—'}</Text>
            <Text className={styles.signDate}>
              {generated ? dayjs(info.endTime || Date.now()).format('YYYY-MM-DD') : ''}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleNewTrip}>
          新运输
        </Button>
        <Button className={styles.generateBtn} onClick={handleGenerate}>
          {generated ? '重新生成报告' : '一键生成摘要'}
        </Button>
      </View>
    </View>
  )
}

export default SummaryPage
