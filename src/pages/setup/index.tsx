import React, { useMemo, useState } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useTransportStore } from '@/store/useTransportStore'
import { GOODS_CATEGORIES, getCategoryByValue } from '@/utils/temperature'
import type { GoodsCategory } from '@/types/transport'

function SetupPage() {
  const {
    status,
    info,
    setPlateNumber,
    setGoodsCategory,
    setTempRange,
    setEstimatedArrival,
    startTransport,
    endTransport,
    resetTransport
  } = useTransportStore()

  const [tempMinInput, setTempMinInput] = useState(String(info.tempMin))
  const [tempMaxInput, setTempMaxInput] = useState(String(info.tempMax))

  const isRunning = status === 'running'
  const isFinished = status === 'finished'
  const canStart = useMemo(() => {
    return info.plateNumber.trim().length > 0
      && info.estimatedArrival > Date.now()
      && info.tempMax > info.tempMin
  }, [info.plateNumber, info.estimatedArrival, info.tempMin, info.tempMax])

  const handleCategorySelect = (category: GoodsCategory) => {
    const opt = getCategoryByValue(category)
    if (!opt) return
    setGoodsCategory(category, opt.label)
    setTempRange(opt.defaultMin, opt.defaultMax)
    setTempMinInput(String(opt.defaultMin))
    setTempMaxInput(String(opt.defaultMax))
  }

  const handleTempMinChange = (val: string) => {
    setTempMinInput(val)
    const num = parseFloat(val)
    if (!isNaN(num)) setTempRange(num, info.tempMax)
  }

  const handleTempMaxChange = (val: string) => {
    setTempMaxInput(val)
    const num = parseFloat(val)
    if (!isNaN(num)) setTempRange(info.tempMin, num)
  }

  const handleDateChange = (e: any) => {
    const dateStr = e.detail.value
    const existing = info.estimatedArrival > 0 ? dayjs(info.estimatedArrival) : dayjs().add(2, 'hour')
    const newTime = dayjs(dateStr).hour(existing.hour()).minute(existing.minute())
    setEstimatedArrival(newTime.valueOf())
  }

  const handleTimeChange = (e: any) => {
    const timeStr = e.detail.value
    const [h, m] = timeStr.split(':').map(Number)
    const existing = info.estimatedArrival > 0 ? dayjs(info.estimatedArrival) : dayjs().add(2, 'hour')
    const newTime = existing.hour(h).minute(m)
    setEstimatedArrival(newTime.valueOf())
  }

  const handleStart = () => {
    if (!canStart) {
      Taro.showToast({ title: '请完善出车信息', icon: 'none' })
      return
    }
    startTransport()
    console.log('[Setup] transport started', {
      plate: info.plateNumber,
      category: info.goodsCategory
    })
    Taro.switchTab({ url: '/pages/transit/index' })
  }

  const handleEndTransport = () => {
    endTransport()
    Taro.switchTab({ url: '/pages/summary/index' })
  }

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '将清除当前运输数据，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          resetTransport()
          setTempMinInput('0')
          setTempMaxInput('4')
        }
      }
    })
  }

  const dateValue = info.estimatedArrival > 0
    ? dayjs(info.estimatedArrival).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD')
  const timeValue = info.estimatedArrival > 0
    ? dayjs(info.estimatedArrival).format('HH:mm')
    : dayjs().add(2, 'hour').format('HH:mm')
  const dateStart = dayjs().format('YYYY-MM-DD')
  const dateEnd = dayjs().add(7, 'day').format('YYYY-MM-DD')

  if (isRunning) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>运输进行中</Text>
          <Text className={styles.subtitle}>当前运输任务已启动，请切换至途中提醒查看实时温度</Text>
        </View>

        <View className={styles.statusBanner}>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>车牌号</Text>
            <Text className={styles.statusBannerValue}>{info.plateNumber}</Text>
          </View>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>货品类别</Text>
            <Text className={styles.statusBannerValue}>{info.goodsCategoryLabel}</Text>
          </View>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>目标温度</Text>
            <Text className={styles.statusBannerValue}>{info.tempMin} ~ {info.tempMax} ℃</Text>
          </View>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>预计到达</Text>
            <Text className={styles.statusBannerValue}>
              {info.estimatedArrival > 0 ? dayjs(info.estimatedArrival).format('MM-DD HH:mm') : '-'}
            </Text>
          </View>
          <View className={styles.bannerActions}>
            <Button className={styles.secondaryBtn} onClick={handleReset}>重置任务</Button>
            <Button className={styles.primarySmallBtn} onClick={handleEndTransport}>结束运输</Button>
          </View>
        </View>

        <Button
          className={styles.startBtn}
          onClick={() => Taro.switchTab({ url: '/pages/transit/index' })}
        >
          查看途中温度 →
        </Button>
      </View>
    )
  }

  if (isFinished) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>运输已完成</Text>
          <Text className={styles.subtitle}>可前往到货摘要查看本趟温度报告</Text>
        </View>

        <View className={styles.statusBanner}>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>车牌号</Text>
            <Text className={styles.statusBannerValue}>{info.plateNumber}</Text>
          </View>
          <View className={styles.statusBannerRow}>
            <Text className={styles.statusBannerLabel}>运输时长</Text>
            <Text className={styles.statusBannerValue}>
              {info.startTime && info.endTime
                ? dayjs(info.endTime).diff(dayjs(info.startTime), 'hour', true).toFixed(1) + ' 小时'
                : '-'}
            </Text>
          </View>
          <View className={styles.bannerActions}>
            <Button className={styles.secondaryBtn} onClick={handleReset}>新建出车</Button>
            <Button className={styles.primarySmallBtn} onClick={() => Taro.switchTab({ url: '/pages/summary/index' })}>
              查看报告
            </Button>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>出车设置</Text>
        <Text className={styles.subtitle}>请在发车前确认以下运输信息</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>车辆信息</Text>
        <View className={styles.field}>
          <Text className={styles.label}>车牌号</Text>
          <Input
            className={styles.input}
            placeholder="请输入车牌号，如 京A12345"
            placeholderClass={styles.pickerPlaceholder as any}
            value={info.plateNumber}
            maxlength={10}
            onInput={(e) => setPlateNumber(e.detail.value.toUpperCase())}
          />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>货品类别</Text>
        <View className={styles.categoryList}>
          {GOODS_CATEGORIES.map((cat) => (
            <View
              key={cat.value}
              className={classnames(styles.categoryItem, info.goodsCategory === cat.value && styles.categoryItemActive)}
              onClick={() => handleCategorySelect(cat.value)}
            >
              <View className={styles.categoryLeft}>
                <Text className={styles.categoryName}>{cat.label.split('（')[0]}</Text>
                <Text className={styles.categoryRange}>
                  推荐温度 {cat.defaultMin} ~ {cat.defaultMax} ℃
                </Text>
              </View>
              {info.goodsCategory === cat.value && (
                <View className={styles.categoryCheck}>✓</View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>目标温度范围</Text>
        <View className={styles.field}>
          <Text className={styles.label}>温度区间（℃）</Text>
          <View className={styles.tempRange}>
            <View className={styles.tempInputWrap}>
              <Input
                className={styles.tempInput}
                type="digit"
                value={tempMinInput}
                onInput={(e) => handleTempMinChange(e.detail.value)}
              />
              <Text className={styles.tempUnit}>℃</Text>
            </View>
            <Text className={styles.tempSep}>~</Text>
            <View className={styles.tempInputWrap}>
              <Input
                className={styles.tempInput}
                type="digit"
                value={tempMaxInput}
                onInput={(e) => handleTempMaxChange(e.detail.value)}
              />
              <Text className={styles.tempUnit}>℃</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预计到达时间</Text>
        <View className={styles.field}>
          <Text className={styles.label}>到达日期</Text>
          <Picker
            mode="date"
            value={dateValue}
            start={dateStart}
            end={dateEnd}
            onChange={handleDateChange}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerText}>
                {dayjs(dateValue).format('YYYY年MM月DD日 dddd')}
              </Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>
        <View className={styles.field}>
          <Text className={styles.label}>到达时间</Text>
          <Picker
            mode="time"
            value={timeValue}
            onChange={handleTimeChange}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerText}>{timeValue}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.actionSection}>
        <Button
          className={classnames(styles.startBtn, !canStart && styles.startBtnDisabled)}
          onClick={handleStart}
        >
          开始运输
        </Button>
        <Text className={styles.tipText}>开始运输后系统将持续监控车厢温度</Text>
      </View>
    </View>
  )
}

export default SetupPage
