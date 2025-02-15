<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-form-item label="员工账号" prop="employeeNumber">
        <el-input v-model="queryParams.employeeNumber" placeholder="请输入员工账号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="员工姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入员工姓名" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>

      <!-- 工作模式 下拉框 -->
      <el-form-item label="工作模式" prop="workPatternId">
        <el-select v-model="queryParams.workPatternId" placeholder="请选择工作模式" clearable @change="handleQuery">
          <el-option v-for="pattern in patternData" :key="pattern.id" :label="pattern.name" :value="pattern.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="openPeopleSettingModal"
          v-hasPermi="['system:scheduling:add']">绑定排班</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="false" type="success" plain icon="el-icon-edit" size="mini" :disabled="single"
          @click="handleUpdate" v-hasPermi="['system:scheduling:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="false" type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple"
          @click="handleDelete" v-hasPermi="['system:scheduling:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="false" type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:scheduling:export']">导出</el-button>
      </el-col>
      <el-button type="primary" size="mini" @click="toWorkArrangeSetting">排班设置</el-button>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="schedulingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="员工账号" align="center" prop="employeeNumber" />
      <el-table-column label="员工姓名" align="center" prop="name" />
      <el-table-column label="员工电话" align="center" prop="phone" />
      <el-table-column label="员工角色" align="center" prop="userType" />
      <el-table-column label="工作模式" align="center" prop="workPatternId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:scheduling:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:scheduling:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改排班管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-form-item class="work-type">
          <el-radio v-model="workPatternType" label="1" @change="handleWorkType">礼拜制</el-radio>
          <el-radio v-model="workPatternType" label="2" @change="handleWorkType">连续制</el-radio>
        </el-form-item>
        <el-form-item label="工作模式:" prop="workPatternId">
          <el-select v-model="workHistoryId" placeholder="请选择" class="history-name" @change="handleSelect">
            <el-option
              v-for="item in workPatternType === '1' ? dialogWorkManageWeekList : dialogWorkManageContinuousList"
              :key="item.id" :label="item.name" :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
    
        

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>





  </div>
</template>

<script>
import { listScheduling, getScheduling, delScheduling, addScheduling, updateScheduling } from "@/api/management/scheduling";
import { patternAll } from '@/api/management/patterns'

export default {
  name: "Scheduling",
  data() {
    return {
      dialogVisible: false,
      multipleSelection: [],
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
      // 排班管理表格数据
      schedulingList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        userType: null,
        employeeNumber: null,
        name: null,
        phone: null,
        workPatternId: null,
        status: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      patternData: {}, // 用来存储接口返回的工作模式数据
      workHistoryId: '',
      dialogWorkManageWeekList: [],
      dialogWorkManageContinuousList: [],
      workPatternType: '1',
    };
  },
  created() {
    this.getList();

  },

  methods: {
    // 更改为选中的内容
    handleWorkType(val) {
      this.workPatternType = val
    },
    handleSelect(val) {
      this.workHistoryId = val
    },
    handleClose() {
      this.dialogVisible = false
      this.workPatternType = '1'
      this.getWorkManageList(this.workPatternType)
      this.workHistoryId = ''
    },
    // 获取排班设置列表数据
    async getWorkManageList(val) {


      const { data: res } =  patternAll()
      console.log("2222 {}",res)
      this.workManageList = [
        ...(res[1] ? res[1] : []),
        ...(res[2] ? res[2] : [])
      ].concat([{ id: '0', name: '暂无排班' }])
      if (val === '1') {
        this.dialogWorkManageWeekList = [...(res[1] ? res[1] : [])]
      } else {
        this.dialogWorkManageContinuousList = [...(res[2] ? res[2] : [])]
      }
    },
    // 打开人工调整弹窗
    openPeopleSettingModal() {
      if (!this.multipleSelection.length) {
        return this.$message({
          message: '请选择调整人员',
          type: 'error'
        })
      }

      this.open = true
    },
    // 跳转至排班设置页面
    toWorkArrangeSetting() {
      this.$router.push('/basic-data/patterns')
    },
    // 获取工作模式数据
    fetchPatternData() {
      patternAll().then(response => {

        const rawData = response.data; // 获取原始数据对象
        let list = []; // 用于存放所有工作模式的扁平化列表

        // 判断返回的 data 是否是一个对象
        if (rawData && typeof rawData === 'object') {
          // 遍历 rawData 中的每一个键
          for (const key in rawData) {
            if (rawData.hasOwnProperty(key)) {
              // 将每个数组中的元素添加到 list 中
              list = list.concat(rawData[key]);
            }
          }
          // 将处理后的 list 存储到 patternData
          this.patternData = list;
        }
      }).catch(error => {
        console.error('获取工作模式失败:', error);
      });

    },
    /** 查询排班管理列表 */
    getList() {
      this.loading = true;
      listScheduling(this.queryParams).then(response => {
        this.schedulingList = response.rows.map(scheduling => {
          scheduling.userType = scheduling.userType === 2 ? '快递员' : '司机';
          return scheduling;
        });
        this.total = response.total;
        this.loading = false;
      });
      //搜索框工作模板
      this.fetchPatternData();
      //
      this.initialDate();
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        userId: null,
        userType: null,
        employeeNumber: null,
        name: null,
        phone: null,
        workPatternId: null,
        status: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加排班管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getScheduling(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改排班管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateScheduling(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addScheduling(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除排班管理编号为"' + ids + '"的数据项？').then(function () {
        return delScheduling(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/scheduling/export', {
        ...this.queryParams
      }, `scheduling_${new Date().getTime()}.xlsx`)
    },
    // 初始数据
    initialDate() {
      // 读取数据
      this.getWorkManageList()
      this.getWorkManageList('1')

    },
    handleSelectionChange(val) {
      this.multipleSelection = val.map((item) => item.id)
    },
    // 获取排班设置列表数据
    async getWorkManageList(val) {
      const { data: res } = await patternAll()
      this.workManageList = [
        ...(res[1] ? res[1] : []),
        ...(res[2] ? res[2] : [])
      ].concat([{ id: '0', name: '暂无排班' }])
      if (val === '1') {
        this.dialogWorkManageWeekList = [...(res[1] ? res[1] : [])]
      } else {
        this.dialogWorkManageContinuousList = [...(res[2] ? res[2] : [])]
      }
    },
  },

};
</script>
