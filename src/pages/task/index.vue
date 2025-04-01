<script setup>
import Navbar from '@/components/Navbar.vue'
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import api from "../../lib/api-client"
import { reactive, computed, ref } from 'vue'

const TASK_STATUS_MAP = ["不接接单", "领取", "已领取", "已完成"]

onShow(fetchListData)

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

const loadingRef = ref(false)

const listData = reactive({
    data: [],
    loading: false,
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
    api.GET("/api/wx/taskDetails/queryByPage", {
        page: listData.pagination.page,
        size: listData.pagination.size,
    }).then(resp => {
        const data = resp.data.data.map(item => ({
            id: item.id,
            taskName: item.taskName,
            acceptStatus: parseInt(item.acceptStatus), //承接订单状态，0不接接单,1:可接单，但是未接单,2已接单，3:已完成
            subtaskId: item.subtaskId //小任务id
        }))
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

function handleTaskDetail(id, acceptStatus, subtaskId) {
    if (acceptStatus === 0)
        return

    if (acceptStatus === 1) {
        // 添加确认弹窗
        uni.showModal({
            title: '确认接单',
            content: '确定要接受这个任务吗？',
            confirmColor: "#006E6B",
            success: function(res) {
                if (res.confirm) {
                    // 用户点击确定，执行接单操作
                    loadingRef.value = true
                    api.GET(`/api/wx/taskDetails/accept/${id}`).then(resp => {
                        uni.showModal({
                            title: '提示信息',
                            content: '接单成功',
                            confirmColor: "#006E6B",
                            showCancel: false,
                        })
                        listData.data.find(item => item.id === id).acceptStatus = 2
                    }).finally(() => {
                        loadingRef.value = false
                    })
                }
            }
        })
    }
    else if (acceptStatus === 2) {
        uni.navigateTo({
            url: `/pages/profile/task/detail?id=${id}`
        })
    }
    else if (acceptStatus === 3) {
        uni.navigateTo({
            url: `/pages/profile/task/sub-task-detail?id=${subtaskId}`
        });
    }
}
</script>

<template>
    <view class="min-h-screen bg">
        <Navbar title="任务中心" :show-back="false" />
        
        <!-- 任务列表区域 -->
        <view class="px-30rpx py-20rpx mt-20rpx">
            <!-- 任务项 -->
            <view v-for="item in listData.data" :key="item.id" class="bg-white rounded-30rpx mb-30rpx p-30rpx flex justify-between items-center">
                <view class="flex items-center">
                    <view class="task-tag-small">
                        <view>
                            小任务
                        </view>
                    </view>
                    <view class="ml-20rpx text-32rpx text-#333 font-bold">{{ item.taskName }}</view>
                </view>
                <button 
                    class="py-14rpx w-180rpx text-center rounded-74rpx text-28rpx mx-0"
                    :class="[item.acceptStatus !== 1 ? 'bg-#AAAAAA text-white font-bold leading-[1.5]' : 'btn-primary']"
                    :loading="loadingRef"
                    :disabled="loadingRef"
                    @click="handleTaskDetail(item.id, item.acceptStatus, item.subtaskId)"
                >
                    {{ TASK_STATUS_MAP[item.acceptStatus] }}
                </button>
            </view>
            <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>
    </view>
</template>
