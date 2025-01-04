import request from '@/utils/request'

// 查询司机管理列表
export function listDriver(query) {
  return request({
    url: '/system/driver/list',
    method: 'get',
    params: query
  })
}

// 查询司机管理详细
export function getDriver(id) {
  return request({
    url: '/system/driver/' + id,
    method: 'get'
  })
}

// 新增司机管理
export function addDriver(data) {
  return request({
    url: '/system/driver',
    method: 'post',
    data: data
  })
}

// 修改司机管理
export function updateDriver(data) {
  return request({
    url: '/system/driver',
    method: 'put',
    data: data
  })
}

// 删除司机管理
export function delDriver(id) {
  return request({
    url: '/system/driver/' + id,
    method: 'delete'
  })
}
