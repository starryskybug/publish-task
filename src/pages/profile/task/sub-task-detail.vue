<script setup>
import Navbar from '@/components/Navbar.vue';
import { onLoad } from '@dcloudio/uni-app';
import api from "../../../lib/api-client"
import { API_BASE_URL } from "../../../lib"
import { ref } from 'vue';

const task = ref({})

onLoad(({id}) => {
    api.GET(`/api/wx/task/subtaskDetails/${id}`).then(resp => {
        task.value = {
            ...resp.data,
            images: resp.data.acceptTaskEvidence.map(item => {
                const url = !item.startsWith('http') ? `${API_BASE_URL}${item}` : item
                return {
                    url,
					extname: url.split('.').pop(),
					name: url.split('/').pop()
                }
            })
        }
    })
})
</script>

<template>
    <view class="min-h-screen bg">
        <Navbar title="任务上传" />
        
        <textarea 
            class="mt-92rpx mx-40rpx border-2 border-solid border-#006E6B rounded-30rpx p-34rpx text-32rpx text-#000 font-bold bg-white w-auto"
            disabled
            :value="task.link"
        />
        <view 
            class="mt-30rpx btn-primary py-22rpx text-32rpx text-center rounded-44rpx w-294rpx mx-auto"
        >
            复制
        </view>

        <!-- 截图区域 -->
        <view class="mx-30rpx bg-white mt-60rpx shadow p-30rpx border border-solid border-#EAEAEA rounded-30rpx">
            <view class="text-32rpx text-#333 font-bold mb-30rpx">上传截图</view>
            <uni-file-picker readonly :value="task.images" file-mediatype="image" />
            <!-- <view class="flex flex-wrap gap-20rpx">
                <view v-for="(img, index) in task.images" :key="index" class="w-160rpx h-160rpx border border-solid border-#EAEAEA rounded-20rpx overflow-hidden">
                    <image 
                        :src="img"
                    mode="aspectFill"
                    class="w-full h-full"
                    ></image>
                </view>
            </view> -->
        </view>
    </view>
</template>