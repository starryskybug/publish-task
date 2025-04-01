<script setup>
import Navbar from '@/components/Navbar.vue'
import { onPullDownRefresh, onReachBottom, onLoad } from '@dcloudio/uni-app'
import api from "../../../lib/api-client"
import { reactive, computed } from 'vue'
import { formatTimeDiff } from '../../../lib'

onLoad(() => {
    fetchListData()
})

// 添加下拉刷新处理
onPullDownRefresh(() => {
    listData.pagination.page = 1
    fetchListData(() => {
        uni.stopPullDownRefresh()
    })
})

// 添加触底加载处理
onReachBottom(() => {
    if (listData.pagination.hasMore && !listData.loading) {
        listData.pagination.page++
        fetchListData()
    }
})

const listData = reactive({
    data: [],
    loading: false,
    query: {},
    pagination: {
        page: 1,
        size: 10,
        hasMore: false
    }
})

const loadMoreStatus = computed(() => {
    if (listData.loading) 
        return 'loading'
    if (listData.pagination.hasMore)
        return 'more'
    return 'noMore'
})

function fetchListData(callback) {
    if (listData.loading) return
    listData.loading = true
    api.GET("/api/wx/task/personal/queryByPage", {
        page: listData.pagination.page,
        size: listData.pagination.size,
    }).then(resp => {
        const data = resp.data.data.map(i =>{
            const now = Date.now()

            return {
                id: i.id,
                name: i.taskName,
                type: i.taskTypeName,
                time: i.taskStatus === 2 
                    ? formatTimeDiff(new Date(i.taskCompleteTime).getTime() - new Date(i.publishTaskTime).getTime())
                    : formatTimeDiff(now - new Date(i.publishTaskTime).getTime()),
                status: i.taskStatus, // (0:未发布,1:进行中,2:已完成)
                completed: i.taskCompletedQuantity,
                total: i.taskTotal
            }
        })
        if (listData.pagination.page === 1) {
            listData.data = data
        } else {
            listData.data = [...listData.data, ...data]
        }
        listData.pagination.hasMore = resp.data.total > listData.pagination.page * listData.pagination.size
    }).finally(() => {
        listData.loading = false
        callback && callback()
    })
}

// 查看任务进度
function navigateToTaskDetail(task) {
    uni.navigateTo({
        url: `/pages/profile/task/detail?id=${task.id}`
    })
}
</script>

<template>
    <view class="min-h-screen bg">
        <Navbar title="我的任务列表" />
        <view class="mt-28rpx mx-30rpx pb-400rpx">
            <!-- 大任务列表 -->
            <view v-for="task in listData.data" :key="task.id" class="bg-white rounded-30rpx mb-30rpx p-30rpx flex items-center">
                <view class="task-tag-big">
                    <view>大任务</view>
                </view>
                <view class="flex-1 flex flex-col ml-20rpx">
                    <view class="text-32rpx font-bold flex items-center">
                        <text class="text-#333">{{ task.name }}</text>
                        <text class="text-#006E6B ml-10rpx">{{ task.time }}</text>
                    </view>
                    <view class="font-bold mt-10rpx">
                        <view class="text-26rpx">
                            <text class="text-#006E6B">{{ task.completed }}</text>
                            <text class="text-#333">/{{ task.total }}</text>
                        </view>
                    </view>
                </view>
                <view 
                    class="btn-primary text-28rpx font-bold py-14rpx px-34rpx rounded-74rpx"
                    @click="navigateToTaskDetail(task)"
                >
                    查看进度
                </view>
            </view>
            <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>

        <view class="fixed bottom-40rpx left-30rpx right-30rpx">
            <view class="border border-solid border-#E0EAE6 rounded-30rpx p-30rpx h-360rpx w-full box-border bg-white">
            </view>
        </view>
    </view>
</template>