import request from '@/utils/request'

// 查询车辆管理列表
export function listTruck(query) {
  return request({
    url: '/system/truck/list',
    method: 'get',
    params: query
  })
}

// 查询车辆管理详细
export function getTruck(id) {
  return request({
    url: '/system/truck/' + id,
    method: 'get'
  })
}

// 新增车辆管理
export function addTruck(data) {
  return request({
    url: '/system/truck',
    method: 'post',
    data: data
  })
}

// 修改车辆管理
export function updateTruck(data) {
  return request({
    url: '/system/truck',
    method: 'put',
    data: data
  })
}

// 删除车辆管理
export function delTruck(id) {
  return request({
    url: '/system/truck/' + id,
    method: 'delete'
  })
}
