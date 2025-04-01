<script setup>
import Navbar from '@/components/Navbar.vue'
import api from "../../lib/api-client"
import { onLoad } from "@dcloudio/uni-app"
import { reactive, ref } from "vue"


onLoad(({amount, number}) => {
    if (amount && number) {
        formState.taskTotal = number
        formState.taskBounty = amount
        formState.type = 'non-customized'
    }
    else {
        formState.type = 'custom'
    }

    api.GET("/api/wx/getAllTaskType").then(resp => {
        taskTypes.value = resp.data.map(i => ({
            label: i.name,
            value: i.id
        }))
    }).catch(err => {
        uni.showToast({
            title: err.msg,
            icon: 'none'
        })
    })
})

const taskTypes = ref([])
const loadingRef = ref(false)

const formState = reactive({
    taskName: '',
    selectedTaskType: {},
    taskLink: '',
    taskTotal: '',
    taskBounty: '',
    type: 'non-customized',
    errors: {
        taskName: null,
        selectedTaskType: null,
        taskLink: null,
        taskTotal: null,
        taskBounty: null,
    }
})

// 表单验证
const validateForm = () => {
    let hasError = false

    if (!formState.taskName) {
        formState.errors.taskName = '请输入任务名称'
        hasError = true
    }
    else if (formState.taskName.length > 10) {
        formState.errors.taskName = '任务名称不能超过10个字符'
        hasError = true
    }
    else {
        formState.errors.taskName = null
    }
    
    if (!formState.selectedTaskType.value) {
        formState.errors.selectedTaskType = '请选择任务分类'
        hasError = true
    }
    else {
        formState.errors.selectedTaskType = null
    }

    if (!formState.taskLink) {
        formState.errors.taskLink = '请输入链接'
        hasError = true
    }
    else {
        formState.errors.taskLink = null
    }

    if (!formState.taskTotal) {
        formState.errors.taskTotal = '请输入任务数量'
        hasError = true
    } 
    else if (parseInt(formState.taskTotal) < 1) {
        formState.errors.taskTotal = '任务数量最少为1'
        hasError = true
    }
    else if (parseInt(formState.taskTotal) > 100) {
        formState.errors.taskTotal = '任务数量最多为100'
        hasError = true
    }
    else if (formState.taskTotal.includes('.')) {
        formState.errors.taskTotal = '任务数量必须为整数'
        hasError = true
    }
    else {
        formState.errors.taskTotal = null
    }

    if (!formState.taskBounty) {
        formState.errors.taskBounty = '请输入赏金'
        hasError = true
    }
    else if (parseFloat(formState.taskBounty) < 1) {
        formState.errors.taskBounty = '赏金最低为1元'
        hasError = true
    }
    else if (parseFloat(formState.taskBounty) > 99999.99) {
        formState.errors.taskBounty = '赏金最高为99999.99'
        hasError = true
    }
    else {
        formState.errors.taskBounty = null
    }

    return !hasError
}

const handleRelease = async () => {
    if (!validateForm()) {
        return
    }

    loadingRef.value = true
    let resp
    try {
        resp = await api.POST("/api/wx/task", {
            taskName: formState.taskName,
            taskType: formState.selectedTaskType.value,
            taskLink: formState.taskLink,
            taskTotal: parseInt(formState.taskTotal),
            // 赏金
            taskBounty: parseFloat(formState.taskBounty),
        })

        uni.requestPayment({
            provider: "wxpay",
            orderInfo: resp.paySign,
            timeStamp: resp.timeStamp,
            nonceStr: resp.nonceStr,
            package: resp.package,
            signType: resp.signType,
            paySign: resp.paySign,
            success: () => {
                uni.showToast({
                    title: "支付成功!",
                    icon: 'none'
                })
                uni.navigateBack()
            },
            fail: () => {
                uni.showToast({
                    title: "支付失败!",
                    icon: "fail"
                })
                uni.navigateBack()
            }
        })
    } finally {
        loadingRef.value = false
    }

    
}

</script>

<template>
    <view class="min-h-screen bg">
        <!-- 顶部导航栏 -->
        <Navbar :title="formState.type === 'non-customized' ? '任务发布' : '自定义任务'" />
        
        <!-- 主要内容区域 -->
        <view class="mx-30rpx mt-30rpx bg-white rounded-20rpx shadow-sm">
            <!-- 任务名称 -->
            <view class="p-30rpx border-b border-#EEEEEE">
                <view class="flex items-center">
                    <text class="text-32rpx font-bold text-#333">任务名称</text>
                    <input 
                        v-model="formState.taskName"
                        type="text" 
                        class="box-border flex-1 text-32rpx text-#333 text-right" 
                        placeholder="请输入" 
                    />
                </view>
                <view v-if="formState.errors.taskName" class="text-right text-28rpx mt-8rpx text-#FF3B30">
                    {{ formState.errors.taskName }}
                </view>
            </view>

            <!-- 任务分类 -->
            <view class="p-30rpx border-b border-#EEEEEE">
                <view class="flex items-center">
                    <text class="text-32rpx font-bold text-#333">任务分类</text>
                    <picker 
                        :range="taskTypes" 
                        range-key="label" 
                        @change="(e) => formState.selectedTaskType = taskTypes[e.detail.value]"
                        class="flex-1"
                    >
                        <view class="flex items-center justify-end box-border w-full">
                            <text class="text-#999999 text-32rpx">{{ formState.selectedTaskType.label || '请选择' }} </text>
                            <image src="/static/arrow-right.png" mode="widthFix" class="w-48rpx h-48rpx" />
                        </view>
                    </picker>
                </view>
                <view v-if="formState.errors.selectedTaskType" class="text-right text-28rpx mt-8rpx text-#FF3B30">
                    {{ formState.errors.selectedTaskType }}
                </view>
            </view>

            <view v-if="formState.type === 'custom'" class="p-30rpx border-b border-#EEEEEE">
                <view class="flex items-center">
                    <text class="text-32rpx font-bold text-#333">赏金</text>
                    <input 
                        v-model="formState.taskBounty"
                        type="digit" 
                        class="box-border flex-1 text-32rpx text-#333 text-right" 
                        placeholder="请输入" 
                    />
                </view>
                <view v-if="formState.errors.taskBounty" class="text-right text-28rpx mt-8rpx text-#FF3B30">
                    {{ formState.errors.taskBounty }}
                </view>
            </view>

            <view v-if="formState.type === 'custom'" class="p-30rpx border-b border-#EEEEEE">
                <view class="flex items-center">
                    <text class="text-32rpx font-bold text-#333">任务数量</text>
                    <input 
                        v-model="formState.taskTotal"
                        type="number" 
                        class="box-border flex-1 text-32rpx text-#333 text-right" 
                        placeholder="请输入" 
                    />
                </view>
                <view v-if="formState.errors.taskTotal" class="text-right text-28rpx mt-8rpx text-#FF3B30">
                    {{ formState.errors.taskTotal }}
                </view>
            </view>

            <!-- 链接 -->
            <view class="p-30rpx">
                <view class="">
                    <text class="text-32rpx font-bold text-#333">链接</text>
                    <textarea  
                        v-model="formState.taskLink"
                        type="text" 
                        class="rounded-20rpx border-2rpx border-solid border-#006E6B bg-#F7F8FA py-20rpx px-30rpx mt-28rpx w-auto" 
                        placeholder="请将复制的链接粘贴到此处" 
                    />
                </view>
                <view v-if="formState.errors.taskLink" class="text-right text-28rpx mt-8rpx text-#FF3B30">
                    {{ formState.errors.taskLink }}
                </view>
            </view>
        </view>
        <button 
            class="btn-primary mx-50rpx text-32rpx py-28rpx fixed bottom-50rpx left-0 right-0 rounded-48rpx leading-none" 
            @click="handleRelease"
            :loading="loadingRef"
            :disabled="loadingRef"
        >
            支付并发布任务
        </button>
    </view>
</template>
