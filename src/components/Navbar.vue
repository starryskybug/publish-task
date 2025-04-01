<script setup>
const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    showBack: {
        type: Boolean,
        default: true
    }
})

function navigateBack() {
    uni.navigateBack()
}
</script>

<template>
    <view class="flex justify-center pt-112rpx relative">
        <image 
            v-if="showBack"
            src="/static/back.png" 
            mode="widthFix" 
            class="w-40rpx h-40rpx absolute left-0 pt-2rpx ml-30rpx"
            @click="navigateBack"
        ></image>
        <view class="text-32rpx font-bold text-#333333">{{ title }}</view>
    </view>
</template>
