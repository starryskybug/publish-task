export const ACCESS_TOKEN_KEY = "Authorization"
export const ACCOUNT_INFO_KEY = "Account_Info"
export const API_BASE_URL = "http://27.150.128.4:8000"

export const TASK_STATUS_MAP = [
    { label: '未发布', color: '#FF9500' },
    { label: '进行中', color: '#006E6B' },
    { label: '已完成', color: '#34C759' },
    { label: '审核中', color: '#FF9500' },
    { label: '审核失败', color: '#FF3B30' },
    { label: '已终止', color: '#FF3B30' }
]

// 格式化时间差
export function formatTimeDiff(timeDiff) {
    // 转换为小时、分钟、秒
    const hours = Math.floor(timeDiff / (60 * 60 * 1000))
    const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000)
    
    // 格式化为 00:00:00
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 使得URL完整
 */
export function resolveResourceURL(url) {
    return `${!url.startsWith('http') ? API_BASE_URL : ""}${url}`
}