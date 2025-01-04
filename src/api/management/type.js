import request from '@/utils/request'

// 查询车型管理列表
export function listType(query) {
  return request({
    url: '/system/type/list',
    method: 'get',
    params: query
  })
}

// 查询车型管理详细
export function getType(id) {
  return request({
    url: '/system/type/' + id,
    method: 'get'
  })
}

// 新增车型管理
export function addType(data) {
  return request({
    url: '/system/type',
    method: 'post',
    data: data
  })
}

// 修改车型管理
export function updateType(data) {
  return request({
    url: '/system/type',
    method: 'put',
    data: data
  })
}

// 删除车型管理
export function delType(id) {
  return request({
    url: '/system/type/' + id,
    method: 'delete'
  })
}

// 车辆类型下拉
export function listCheck() {
  return request({
    url: '/system/type/listCheck',
    method: 'get'
  })
}
