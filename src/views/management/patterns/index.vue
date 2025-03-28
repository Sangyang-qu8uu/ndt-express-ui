<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="工作模式名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入工作模式名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:pattern:add']">添加工作模式
        </el-button>
      </el-col>

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="patternList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="工作模式编号" align="center" prop="id" />
      <el-table-column label="工作模式名称" align="center" prop="name" />
      <el-table-column label="工作模式类型" align="center" prop="workPatternType" />
      <el-table-column label="工作日期" align="center" prop="workDate" />
      <el-table-column label="工作时间" align="center">
        <template slot-scope="scope">
          <span>{{
            (
              (scope.row.workEndMinute1 - scope.row.workStartMinute1) /
              60
            ).toFixed(2)
          }}小时</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)"
            v-hasPermi="['system:pattern:edit']">修改
          </el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:pattern:remove']">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改工作模式对话框 -->
    <el-dialog :title="type === 'add' ? '新增工作模式' : '编辑工作模式'" :visible.sync="open" width="560px"
      :before-close="handleClose" append-to-body>
      <el-tabs v-model="workPatternType" class="tab-box" @tab-click="handleClick">
        <el-tab-pane v-if="
          (this.workPatternType === '1' && this.type === 'edit') ||
          this.type === 'add'
        " label="礼拜制" name="1">
          <el-form ref="dataForm" :rules="ruleInline" :model="weekParams" label-position="right" label-width="130px"
            style="width: 100%">
            <el-form-item label="工作模式名称：" prop="name" style="margin-bottom: 0px">
              <el-input v-model="weekParams.name" placeholder="请填写工作模式名称"></el-input>
            </el-form-item>
            <el-form-item label="连续工作天数：" prop="workDay" style="margin-bottom: 15px" class="workDay">
              <el-checkbox-group v-model="weekParams.workDay" @change="handleCheckedChange">
                <el-checkbox v-for="day in weekList" :key="day" :label="day">{{ day }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <div class="tips">选中为工作时间，未选中为休息时间</div>
            <el-form-item label="工作时间：" prop="dateRange">
              <el-time-picker v-model="weekParams.dateRange" is-range range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" format="HH:mm" :editable="false" @change="handleDate">
              </el-time-picker>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="连续制" v-if="
          (this.workPatternType === '2' && this.type === 'edit') ||
          this.type === 'add'
        " name="2">
          <el-form ref="dataForm1" :rules="ruleInline2" :model="continuousParams" label-position="right"
            label-width="130px" style="width: 100%">
            <el-form-item label="工作模式名称：" prop="name" style="margin-bottom: 15px">
              <el-input v-model="continuousParams.name" placeholder="请填写工作模式名称"></el-input>
            </el-form-item>
            <el-form-item label="连续工作天数：" prop="workDay" style="margin-bottom: 15px">
              上
              <el-input v-model="continuousParams.workDayNum" placeholder="请输入"
                style="width: 110px; margin-right: 21px; margin-left: 10px">
                <span slot="suffix" style="
                      color: #20232a;
                      font-weight: 400;
                      font-size: 14px;
                      font-family: PingFangSC, PingFangSC-Regular;
                      margin-right: 14px;
                      ">天</span></el-input>
              休
              <el-input v-model="continuousParams.restDayNum" placeholder="请输入" style="width: 110px; margin-left: 10px">
                <span slot="suffix" style="
                        color: #20232a;
                        font-weight: 400;
                        font-size: 14px;
                        font-family: PingFangSC, PingFangSC-Regular;
                        margin-right: 14px;
                      ">天</span></el-input>
            </el-form-item>
            <el-form-item label="工作时间：" prop="dateRange2">
              <el-time-picker v-model="continuousParams.dateRange" is-range range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" format="HH:mm" :editable="false" @change="handleDate">
              </el-time-picker>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPattern, getPattern, delPattern, addPattern, updatePattern } from '@/api/management/patterns'
import { getHMS } from '@/utils'
import type from '@/views/management/type/index.vue'


export default {
  name: 'Patterns',
  data() {
    return {
      id: '', // 工作模式ID
      workPatternType: '1',
      weekList: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      ruleInline: {
        dateRange: [
          {
            required: true,
            validator: this.validateDateRange,
            trigger: 'blur'
          }
        ],
        name: [
          { required: true, message: '工作模式名称不能为空', trigger: 'blur' }
        ],
        workDay: [
          { required: true, validator: this.validateWorkDay, trigger: 'blur' },
        ],
        workDay: [
          { required: true, message: '连续工作天数不能为空', trigger: 'blur' }
        ],
        dateRange: [
          { required: true, message: '工作时间不能为空', trigger: 'blur' }
        ]
      },

      type: 'add',
      ruleInline2: {
        dateRange2: [
          {
            required: true,
            validator: this.validateDateRange2,
            trigger: 'blur'
          }
        ],
        workDay2: [
          { required: true, validator: this.validateWorkDay2, trigger: 'blur' }
        ],
        name: [
          { required: true, message: '工作模式名称不能为空', trigger: 'blur' }
        ]
      },
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 工作模式表格数据
      patternList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 礼拜制
      weekParams: {
        name: '', // 工作模式名称
        workEndMinute1: new Date(2016, 9, 10, 18, 0).getTime(), // 工作结束时间,2016年9月10号18点至此刻的毫秒数
        workStartMinute1: new Date(2016, 9, 10, 9, 0).getTime(), // 工作开始时间，2016年9月10号9点至此刻的毫秒数
        workPatternType: '', // 工作类型
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: '',
        dateRange: [
          new Date(2016, 9, 10, 9, 0).getTime(),
          new Date(2016, 9, 10, 18, 0).getTime()
        ],
        workDay: []
      },
      // 连续制
      continuousParams: {
        name: '',
        workPatternType: '',
        workEndMinute1: new Date(2016, 9, 10, 18, 0).getTime(),
        workStartMinute1: new Date(2016, 9, 10, 9, 0).getTime(),
        restDayNum: '', // 休息天数
        workDayNum: '', // 上班天数
        dateRange: [
          new Date(2016, 9, 10, 9, 0).getTime(),
          new Date(2016, 9, 10, 18, 0).getTime()
        ]
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        userType: null,
        workPatternType: null,
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
        workDayNum: null,
        restDayNum: null,
        workStartMinute1: null,
        workEndMinute1: null,
        status: null
      },
      // 表单参数
      form: {
        workPatternType: '礼拜制度'
      }

    }
  },
  created() {
    this.getList()
  },
  methods: {
    handleClick(tab, event) {
      this.workPatternType = tab.name
    },
    /** 查询工作模式列表 */
    getList() {
      this.loading = true
      listPattern(this.queryParams).then(response => {
        this.patternList = response.rows
        this.total = response.total
        this.loading = false
      });

    },
    // 连续工作天数选择
    handleCheckedChange(value) {
      this.weekParams.workDay = value
    },
    handleDate(value) {
      if (this.workPatternType === '1') {
        this.weekParams.dateRange = value
          ? [value[0].getTime(), value[1].getTime()]
          : []
        this.weekParams.workStartMinute1 = value[0].getTime()
        this.weekParams.workEndMinute1 = value[1].getTime()
      } else {
        this.continuousParams.dateRange = value
          ? [getHMS(value[0]), getHMS(value[1])]
          : []
        this.continuousParams.workStartMinute1 = value[0].getTime()
        this.continuousParams.workEndMinute1 = value[1].getTime()
      }
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      if (this.workPatternType === '2') {
        this.continuousParams = {
          name: '',
          workPatternType: '',
          workEndMinute1: new Date(2016, 9, 10, 18, 0).getTime(),
          workStartMinute1: new Date(2016, 9, 10, 9, 0).getTime(),
          restDayNum: '', // 休息天数
          workDayNum: '', // 上班天数
          dateRange: [
            new Date(2016, 9, 10, 9, 0).getTime(),
            new Date(2016, 9, 10, 18, 0).getTime()
          ]
        }
        this.resetForm('dataForm1')
      } else {
        this.weekParams = {
          name: '', // 工作模式名称
          workEndMinute1: new Date(2016, 9, 10, 18, 0).getTime(), // 工作结束时间,2016年9月10号18点至此刻的毫秒数
          workStartMinute1: new Date(2016, 9, 10, 9, 0).getTime(), // 工作开始时间，2016年9月10号9点至此刻的毫秒数
          workPatternType: '', // 工作类型
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: '',
          dateRange: [
            new Date(2016, 9, 10, 9, 0).getTime(),
            new Date(2016, 9, 10, 18, 0).getTime()
          ],
          workDay: []
        }
        this.resetForm('dataForm')
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.open = true
      this.type = 'add'
      this.reset()
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getPattern(id).then(response => {
        this.continuousParams = response.data
        console.log('赋值给修改的对象', this.continuousParams)
        this.form = response.data
        this.open = true
        this.title = '修改工作模式'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs[
        this.workPatternType === '1' ? 'dataForm' : 'dataForm1'
      ].validate(async (valid) => {
        if (valid) {
          const params = this.dealWithParams(this.type, this.workPatternType)
          console.log("121212", this.type)
          if (this.type === 'edit') {
            console.log('修改的json数据：{}', params)
            updatePattern(Object.assign(params, { id: this.id })).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
              this.handleClose()
            })
          } else {
            console.log("新增的json数据：{}", params)
            addPattern(params).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
              this.handleClose()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除工作模式编号为"' + ids + '"的数据项？').then(function () {
        return delPattern(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/pattern/export', {
        ...this.queryParams
      }, `pattern_${new Date().getTime()}.xlsx`)
    },
    dealWithParams(type, workPatternType) {
      if (workPatternType === '1') {
        return {
          name: this.weekParams.name,
          workEndMinute1:
            // 此处需要将时间转为距离当天0点0分的分钟数的差值
            (this.weekParams.workEndMinute1 -
              new Date(2016, 9, 10, 0, 0).getTime()) /
            1000 /
            60,
          workStartMinute1:
            (this.weekParams.workStartMinute1 -
              new Date(2016, 9, 10, 0, 0).getTime()) /
            1000 /
            60,
          workPatternType: this.workPatternType,
          monday: this.weekParams.workDay.findIndex((item) => item === '周一') === -1 ? '2' : '1',
          tuesday: this.weekParams.workDay.findIndex((item) => item === '周二') === -1 ? '2' : '1',
          wednesday: this.weekParams.workDay.findIndex((item) => item === '周三') === -1 ? '2' : '1',
          thursday: this.weekParams.workDay.findIndex((item) => item === '周四') === -1 ? '2' : '1',
          friday: this.weekParams.workDay.findIndex((item) => item === '周五') === -1 ? '2' : '1',
          saturday: this.weekParams.workDay.findIndex((item) => item === '周六') === -1 ? '2' : '1',
          sunday: this.weekParams.workDay.findIndex((item) => item === '周日') === -1 ? '2' : '1'
        }
      } else {
        return {
          name: this.continuousParams.name,
          workPatternType: this.workPatternType,
          workEndMinute1: (this.continuousParams.workEndMinute1 - new Date(2016, 9, 10, 0, 0).getTime()) / 1000 / 60,
          workStartMinute1: (this.continuousParams.workStartMinute1 - new Date(2016, 9, 10, 0, 0).getTime()) / 1000 / 60,
          restDayNum: this.continuousParams.restDayNum,
          workDayNum: this.continuousParams.workDayNum
        }
      }
    },
    validateDateRange2(rule, value, callback) {
      if (!this.continuousParams.dateRange.length) {
        callback()
      } else {
        callback()
      }
    },
    validateDateRange(rule, value, callback) {
      if (!this.weekParams.dateRange.length) {
        callback()
      } else {
        callback()
      }
    },
    // 编辑工作模式
    async handleEdit(row) {
      this.open = true
      this.type = 'edit'
      const id = row.id || this.ids
      const { data: res } = await getPattern(id)
      console.log('编辑时查询单条数据:', res)
      this.workPatternType = res.workPatternType
      this.id = res.id
      console.log("id", id)
      if (res.workPatternType === '1') {
        this.weekParams = {
          name: res.name,
          dateRange: [
            new Date(2016, 9, 10, 0, 0).getTime() + res.workStartMinute1 * 60 * 1000,
            new Date(2016, 9, 10, 0, 0).getTime() + res.workEndMinute1 * 60 * 1000
          ],
          workPatternType: res.workPatternType,
          workEndMinute1:
            new Date(2016, 9, 10, 0, 0).getTime() + res.workEndMinute1 * 60 * 1000,
          workStartMinute1:
            new Date(2016, 9, 10, 0, 0).getTime() + res.workStartMinute1 * 60 * 1000,
          monday: res.monday,
          tuesday: res.tuesday,
          wednesday: res.wednesday,
          thursday: res.thursday,
          friday: res.friday,
          saturday: res.saturday,
          sunday: res.sunday,
          workDay: [
            res.monday === '1' ? '周一' : '',
            res.tuesday === '1' ? '周二' : '',
            res.wednesday === '1' ? '周三' : '',
            res.thursday === '1' ? '周四' : '',
            res.friday === '1' ? '周五' : '',
            res.saturday === '1' ? '周六' : '',
            res.sunday === '1' ? '周日' : ''
          ]
        }
      } else {
        this.continuousParams = {
          name: res.name,
          workPatternType: res.workPatternType,
          workEndMinute1:
            new Date(2016, 9, 10, 0, 0).getTime() +
            res.workEndMinute1 * 60 * 1000,
          workStartMinute1:
            new Date(2016, 9, 10, 0, 0).getTime() +
            res.workStartMinute1 * 60 * 1000,
          restDayNum: res.restDayNum,
          workDayNum: res.workDayNum,
          dateRange: [
            new Date(2016, 9, 10, 0, 0).getTime() +
            res.workStartMinute1 * 60 * 1000,
            new Date(2016, 9, 10, 0, 0).getTime() +
            res.workEndMinute1 * 60 * 1000
          ]
        }
      }
    },
    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
      // 处理关闭一瞬间表单重置问题
      setTimeout(() => {
        this.workPatternType = '1'
        this.$nextTick(() => {
          if (this.workPatternType === '1') {
            this.$refs.dataForm.resetFields()
          } else {
            this.$refs.dataForm1.resetFields()
          }
        })
      }, 200)
    },

  }
}
</script>
