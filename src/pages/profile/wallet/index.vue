<script setup>
import Navbar from '@/components/Navbar.vue'
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ACCOUNT_INFO_KEY } from '../../../lib'

onLoad(() => {
    walletBalanceRaw.value = parseFloat(uni.getStorageSync(ACCOUNT_INFO_KEY).accountBalance || 0) * 100
})

// 模拟钱包数据 - 以分为单位存储
const walletBalanceRaw = ref(0) // 以分为单位

// 金额转换函数：将分转换为元，并添加千位分隔符
const formatAmount = (amount) => {
    // 将分转换为元（除以100）
    const yuan = (amount / 100).toFixed(2)

    // 分割整数部分和小数部分
    const [intPart, decimalPart] = yuan.split('.')

    // 为整数部分添加千位分隔符
    const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return `${formattedIntPart}.${decimalPart}`
}

// 计算属性：格式化后的钱包余额
const walletBalance = computed(() => {
    return formatAmount(walletBalanceRaw.value)
})
</script>

<template>
    <view class="relative">
        <!-- 背景图片 -->
        <image src="/static/profile/wallet-banner.png" class="absolute top-0 left-0 w-full h-400rpx" mode="aspectFill" />
        <Navbar title="我的佣金" />
        
        <!-- 钱包卡片 -->
        <view class="bg-white rounded-30rpx mx-30rpx mt-54rpx z-1 relative shadow pb-30rpx">
            <view class="text-center text-28rpx pt-80rpx">我的佣金 (元)</view>
            
            <view class="text-center text-#006E6B text-80rpx font-bold my-32rpx">
                {{ walletBalance }}
            </view>
            
            <navigator url="/pages/profile/wallet/withdraw" class="mt-50rpx mx-66rpx">
                <button 
                    class="btn-primary py-22rpx text-28rpx leading-44rpx rounded-110rpx"
                >
                    提现
                </button>
            </navigator>
        </view>
    </view>
</template>
