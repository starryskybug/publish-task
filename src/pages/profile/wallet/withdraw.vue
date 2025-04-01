<script setup>
import { reactive, ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import api from '../../../lib/api-client'
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
    api.GET("/api/wx/getUserInfo").then(resp => {
        availableAmount.value = parseFloat(resp.data.accountBalance || 0)
    })
})

// 可提现金额
const availableAmount = ref(0)
const loadingRef = ref(false)

const form = reactive({
    // 提现方式
    withdrawType: '微信零钱',
    // 姓名
    name: '',
    // 微信账号
    wechatAccount: '',
    // 提现金额
    withdrawAmount: 0
})

// 全部提现
function withdrawAll() {
    form.withdrawAmount = availableAmount.value
}

// 提交提现申请
function submitWithdraw() {
    if (!form.withdrawType) {
        uni.showToast({
            title: '请选择提现方式',
            icon: 'none'
        })
        return
    }

    if (!form.name) {
        uni.showToast({
            title: '请输入姓名',
            icon: 'none'
        })
        return
    }

    if (form.name.length > 10) {
        uni.showToast({
            title: '姓名不能超过10个字符',
            icon: 'none'
        })
        return
    }

    if (!form.wechatAccount) {
        uni.showToast({
            title: '请输入微信账号',
            icon: 'none'
        })
        return
    }

    if (form.wechatAccount.length > 50) {
        uni.showToast({
            title: '微信账号不能超过50个字符',
            icon: 'none'
        })
        return
    }

    if (form.withdrawAmount <= 0) {
        uni.showToast({
            title: '请输入提现金额',
            icon: 'none'
        })
        return
    }

    if (form.withdrawAmount > availableAmount.value) {
        uni.showToast({
            title: '提现金额不能大于可提现金额',
            icon: 'none'
        })
        return
    }

    loadingRef.value = true
    api.POST("/api/wx/my/withdrawalApplication", {
        withdrawalAmount: parseFloat(form.withdrawAmount),
        payeeName: form.name,
        payeeAccountCode: form.wechatAccount,
    }).then(resp => {
        uni.showToast({
            title: resp.msg,
            icon: 'success'
        })
        uni.navigateBack()
    }).catch(err => {
        uni.showToast({
            title: err.data,
            icon: 'none'
        })
    }).finally(() => {
        loadingRef.value = false
    })
}
</script>

<template>
    <view class="min-h-screen bg-#F7F8FA">
        <!-- 顶部导航栏 -->
        <view class="bg-white pb-20rpx">
            <Navbar title="提现" />
        </view>
        
        <!-- 提现金额区域 -->
        <view class="px-30rpx pt-66rpx">
            <view class="bg-white rounded-30rpx p-30rpx mb-30rpx">
                <view class="text-32rpx mb-20rpx">提现余额</view>
                
                <view class="relative mb-10rpx flex items-center border-b border-b-solid border-#eee">
                    <text class="text-32rpx">¥</text>
                    <input 
                        type="digit" 
                        v-model="form.withdrawAmount"
                        class="w-full h-80rpx pl-20rpx text-32rpx" 
                        placeholder="请输入提现金额" 
                    />
                </view>
                
                <view class="flex justify-between items-center text-28rpx text-#999">
                    <text>可提现金额 ¥{{ availableAmount }}</text>
                    <text class="text-#006E6B" @click="withdrawAll">全部提现</text>
                </view>
            </view>
        
            <!-- 提现账户区域 -->
            <view class="bg-white rounded-30rpx p-30rpx">
                <view class="text-32rpx mb-20rpx">提现账户</view>
            
                <view class="mb-30rpx">
                    <view class="text-24rpx mb-10rpx">提现方式</view>
                    <input 
                        type="text" 
                        v-model="form.withdrawType"
                        class="px-26rpx py-16rpx bg-#F7F8FA rounded-8rpx text-24rpx" 
                        placeholder="输入提现方式" 
                        disabled
                    />
                </view>
            
                <view class="mb-30rpx">
                    <view class="text-28rpx mb-10rpx">姓名</view>
                    <input 
                        type="text" 
                        v-model="form.name"
                        class="px-26rpx py-16rpx bg-#F7F8FA rounded-8rpx text-24rpx" 
                        placeholder="输入姓名" 
                    />
                </view>
            
                <view class="mb-30rpx">
                    <view class="text-28rpx mb-10rpx">微信账号</view>
                    <input 
                        type="text" 
                        v-model="form.wechatAccount"
                        class="px-26rpx py-16rpx bg-#F7F8FA rounded-8rpx text-24rpx" 
                        placeholder="输入微信账号" 
                    />
                </view>
            </view>
        </view>
    
        <!-- 底部提交按钮 -->
        <button 
            class="btn-primary text-32rpx py-28rpx mx-50rpx fixed bottom-50rpx left-0 right-0 rounded-48rpx"
            @click="submitWithdraw"
            :loading="loadingRef"
            :disabled="loadingRef"
        >
            确认提现
        </button>
    </view>
</template>

<style scoped>
/* 可以在这里添加额外的样式 */
</style>


