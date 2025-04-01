<script setup>
import Navbar from '@/components/Navbar.vue';
import { reactive, computed, ref } from 'vue';
import { onPullDownRefresh, onReachBottom, onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import api from "../../../lib/api-client";

// 定义任务ID参数
const taskId = ref('');

// 初始化数据结构
const listData = reactive({
    data: [],
    loading: false,
    pagination: {
        page: 1,
        size: 20,
        hasMore: false
    }
});

// 计算加载状态
const loadMoreStatus = computed(() => {
    if (listData.loading) 
        return 'loading';
    if (listData.pagination.hasMore)
        return 'more';
    return 'noMore';
});

// 页面加载时获取数据
onLoad((options) => {
    if (options.id) {
        taskId.value = options.id;
        fetchListData();
    }
});

// 添加下拉刷新处理
onPullDownRefresh(() => {
    listData.pagination.page = 1;
    fetchListData(() => {
        uni.stopPullDownRefresh();
    });
});

// 添加触底加载处理
onReachBottom(() => {
    if (listData.pagination.hasMore && !listData.loading) {
        listData.pagination.page++;
        fetchListData();
    }
})

onShareAppMessage(() => {
    return {
        title: '帮我完成任务，赚取佣金！',
        path: "/pages/task/index",
    }
})

// 获取任务列表数据
function fetchListData(callback) {
    if (listData.loading) return;
    listData.loading = true;
    api.GET(`/api/wx/task/subtaskByPage/${taskId.value}`, {
        pageNum: listData.pagination.page,
        pageSize: listData.pagination.size,
    }).then(resp => {
        const data = resp.data.data.map(item => {
            return {
                id: item.id,
                name: item.name,
                status: item.subtaskStatus === "2" ? 'completed' : 'pending' // 子任务状态(0:未接单,1:接单;2:完成)
            };
        });
        
        if (listData.pagination.page === 1) {
            listData.data = data;
        } else {
            listData.data = [...listData.data, ...data];
        }
        
        listData.pagination.hasMore = resp.data.total > listData.pagination.page * listData.pagination.size;
    }).finally(() => {
        listData.loading = false;
        callback && callback();
    });
}

// 跳转任务详情
function navigateToSubTaskDetail(task) {
    if (task.status === "completed") {
        uni.navigateTo({
            url: `/pages/profile/task/sub-task-detail?id=${task.id}`
        });
    } else {
        uni.showToast({
            title: '任务未完成',
            icon: 'none'
        });
    }
}
</script>

<template>
    <view class="min-h-screen bg-#F7F8FA">
        <Navbar title="任务列表详情" />
        
        <view class="p-30rpx">
            <view 
                v-for="task in listData.data" 
                :key="task.id" 
                class="mb-30rpx bg-white rounded-30rpx px-30rpx py-20rpx flex items-center"
            >
                <!-- 任务名称 -->
                <view class="text-32rpx font-bold text-#333 flex-1">{{ task.name }}</view>
                
                <!-- 状态和分享按钮 -->
                <view class="flex items-center text-28rpx font-bold text-white">
                    <!-- 状态按钮 -->
                    <view 
                        class="rounded-74rpx px-30rpx py-14rpx mr-20rpx"
                        :class="[task.status === 'completed' ? 'bg-#006E6B' : 'bg-#AAAAAA']"
                        @click="navigateToSubTaskDetail(task)"
                    >
                        {{ task.status === 'completed' ? '已完成' : '未完成' }}
                    </view>
                    
                    <!-- 分享按钮 -->
                    <button 
                        open-type="share"
                        class="rounded-74rpx px-30rpx py-14rpx bg-#006E6B text-white text-28rpx leading-37rpx"
                    >
                        分享
                    </button>
                </view>
            </view>
            
            <!-- 加载更多组件 -->
            <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>
    </view>
</template>
