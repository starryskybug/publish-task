<script setup>
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import api from "../lib/api-client"
import { ref } from 'vue'
import { ACCESS_TOKEN_KEY, resolveResourceURL } from '../lib'

onShow(() => {
    fetchLastTask()
    api.GET("/api/wx/getHomeImages").then(resp => {
        carousels.value = resp.data.map(i => resolveResourceURL(i))
    })
})

onPullDownRefresh(() => {
    fetchLastTask(() => {
        uni.stopPullDownRefresh()
    })
})

const task = ref(null)
const carousels = ref([])
const current = ref(0) // 当前轮播图索引
const dotsStyles = ref({
    backgroundColor: 'rgba(0, 0, 0, .3)',
    border: '1px rgba(0, 0, 0, .3) solid',
    color: '#fff',
    selectedBackgroundColor: '#006E6B',
    selectedBorder: '1px #006E6B solid'
})

// 轮播图切换事件
function change(e) {
    current.value = e.detail.current
}

// 任务列表数据
const taskList = ref([
    { amount: 8.8, number: 10 },
    { amount: 16.8, number: 20 },
    { amount: 24.8, number: 30 }
])  

function fetchLastTask(callback) {
    const token = uni.getStorageSync(ACCESS_TOKEN_KEY)
    if (token) {
        api.GET("/api/wx/task/queryByNow").then(resp => {
            task.value = resp.data
        }).finally(() => {
            callback && callback()
        })
    }
}

function navigateToTaskRelease(index) {
    const url = index !== undefined ? `/pages/task-release/post?amount=${taskList.value[index].amount}&number=${taskList.value[index].number}` : '/pages/task-release/post'

    uni.navigateTo({
        url
    })
}

function navigateToTaskDetail(taskId) {
    uni.navigateTo({
        url: `/pages/profile/task/detail?id=${taskId}`
    })
}
</script>

<template>
    <view class="bg-#F7F8FA min-h-screen flex flex-col">
        <uni-swiper-dot
            :info="carousels"
            :current="current"
            mode="dot"
        >
            <swiper class="top-swiper-box" @change="change">
                <swiper-item v-for="(item, index) in carousels" :key="index">
                    <view class="top-swiper-item">
                        <image :src="item" mode="aspectFill" style="width: 100%; height: 100%;"></image>
                    </view>
                </swiper-item>
            </swiper>
        </uni-swiper-dot>
        <view class="px-30rpx flex-1 flex flex-col">
            <view class="mt-2% flex items-center gap-x-10rpx">
                <view 
                    class="w-8rpx h-40rpx rounded-10rpx"
                    style="background: linear-gradient(180deg, #E0EAE6 0%, #006E6B 100%)"
                ></view>
                <text class="text-36rpx text-black font-bold">
                    发布任务
                </text>
            </view>

            <view class="mt-3% flex gap-x-20rpx">
                <view 
                    class="px-30rpx pt-60rpx pb-40rpx text-64rpx task-release-card w-1/3"
                    style="background: linear-gradient( 147deg, #BFE5E4 24%, #FFFFFF 100%);"
                    @click="navigateToTaskRelease(0)"
                >
                    <text class="text-black">{{ taskList[0].amount }}元</text>
                    <text class="text-#006E6B">{{ taskList[0].number }}个</text>
                    <image
                        src="/static/index/arrow-right.png"
                        mode="widthFix"
                        class="w-68rpx h-68rpx mt-56rpx"
                    />
                </view>
                <view class="flex-1 flex flex-col gap-y-3%">
                    <view class="flex items-center gap-x-20rpx">
                        <view class="px-24rpx py-30rpx text-34rpx task-release-card gap-y-10rpx flex-1" @click="navigateToTaskRelease(1)">
                            <text class="text-black">{{ taskList[1].amount }}元</text>
                            <text class="text-#006E6B">{{ taskList[1].number }}个</text>
                            <image
                                src="/static/index/arrow-right.png"
                                mode="widthFix"
                                class="w-40rpx h-40rpx"
                            />
                        </view>
                        <view class="px-24rpx py-30rpx text-34rpx task-release-card gap-y-10rpx flex-1" @click="navigateToTaskRelease(2)">
                            <text class="text-black">{{ taskList[2].amount }}元</text>
                            <text class="text-#006E6B">{{ taskList[2].number }}个</text>
                            <image
                                src="/static/index/arrow-right.png"
                                mode="widthFix"
                                class="w-40rpx h-40rpx"
                            />
                        </view>
                    </view>
                    <view
                        class="flex-1 task-release-card !flex-row items-center p-30rpx"
                        style="background: linear-gradient( 147deg, #BFE5E4 24%, #FFFFFF 100%);"
                    >
                        <view class="flex-1 flex flex-col gap-y-10rpx" @click="navigateToTaskRelease()">
                            <text class="text-#000B54 text-34rpx font-bold">自定义</text>
                            <text class="text-#000B54/30 text-20rpx">customize</text>
                            <image
                                src="/static/index/arrow-right.png"
                                mode="widthFix"
                                class="w-40rpx h-40rpx"
                            />
                        </view>
                        <image
                            src="/static/index/customize.png"
                            mode="widthFix"
                            class="w-108rpx h-108rpx"
                        />
                    </view>
                </view>
            </view>
    
            <view class="mt-4% flex items-center justify-between mb-26rpx">
                <view class="flex items-center gap-x-10rpx">
                    <view 
                        class="w-8rpx h-40rpx rounded-10rpx"
                        style="background: linear-gradient(180deg, #E0EAE6 0%, #006E6B 100%)"
                    ></view>
                    <text class="text-36rpx text-black font-bold">
                        最新任务
                    </text>
                </view>
                <navigator url="/pages/profile/task/release" class="text-28rpx text-#333">
                    查看更多 >
                </navigator>
            </view>
            <view v-if="task" class="flex flex-col gap-y-20rpx">
                <view class="bg-white rounded-30rpx p-30rpx flex items-center gap-x-20rpx">
                    <view class="task-tag-big">
                        <view>
                            大任务
                        </view>
                    </view>
                    <view class="flex-1 flex flex-col gap-y-10rpx gap-y-10rpx text-#333333 font-bold">
                        <text class="text-32rpx">{{ task.taskName }}</text>
                        <view class="text-26rpx ">
                            <text class="text-#006E6B">{{ task.taskCompletedQuantity }}</text>
                            <text>/{{ task.taskTotal }}</text>
                        </view>
                    </view>
                    <button class="btn-primary text-28rpx px-34rpx py-14rpx rounded-74rpx" @click="navigateToTaskDetail(task.id)">
                        查看进度
                    </button>
                </view>
            </view>
            <view v-else class="text-center text-28rpx text-#999999">
                暂无任务
            </view>
        </view>
        <!-- ad -->
        <view class="border border-solid border-#E0EAE6 rounded-30rpx mx-30rpx p-30rpx h-360rpx w-auto box-border bg-white my-2%">
        </view>
    </view>
</template>

<style scoped>
.task-release-card {
    box-shadow: 0px 12px 20px 0px rgba(0,110,107,0.2);
    border-radius: 30rpx;
    background-color: white;
    display: flex;
    flex-direction: column;
    font-weight: bold;
}

.top-swiper-box {
    width: 100%;
    height: 370rpx;
    border-radius: 0 0 40rpx 40rpx;
    overflow: hidden;
}

.top-swiper-item {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
</style>