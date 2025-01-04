import request from '@/utils/request'

// 查询快递员列表
export function listCourier(query) {
  return request({
    url: '/system/courier/list',
    method: 'get',
    params: query
  })
}

// 查询快递员详细
export function getCourier(id) {
  return request({
    url: '/system/courier/' + id,
    method: 'get'
  })
}

// 新增快递员
export function addCourier(data) {
  return request({
    url: '/system/courier',
    method: 'post',
    data: data
  })
}

// 修改快递员
export function updateCourier(data) {
  return request({
    url: '/system/courier',
    method: 'put',
    data: data
  })
}

// 删除快递员
export function delCourier(id) {
  return request({
    url: '/system/courier/' + id,
    method: 'delete'
  })
}
