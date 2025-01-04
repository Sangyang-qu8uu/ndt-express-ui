<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      
      <el-form-item label="车辆类型名称" prop="truckTypeName">
        <el-input
          v-model="queryParams.truckTypeName"
          placeholder="请输入车辆类型名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车牌号码" prop="licensePlate">
        <el-input
          v-model="queryParams.licensePlate"
          placeholder="请输入车牌号码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
     
     
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:truck:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:truck:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:truck:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:truck:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="truckList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="车辆类型名称" align="center" prop="truckTypeName" />
      <el-table-column label="车牌号码" align="center" prop="licensePlate" />
      <el-table-column label="司机数量" align="center" prop="driverNum" />
      <el-table-column label="GPS设备id" align="center" prop="deviceGpsId" />
      <el-table-column label="准载重量" align="center" prop="allowableLoad" />
      <el-table-column label="准载体积" align="center" prop="allowableVolume" />
      <el-table-column label="车辆状态" align="center" prop="status" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:truck:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:truck:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改车辆管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        
        <!-- 车辆类型名称下拉选择框 -->
    <el-form-item label="车辆类型名称" prop="truckTypeName">
      <el-select v-model="form.truckTypeName" placeholder="请选择车辆类型名称" @change="handleTruckTypeChange">
        <el-option
          v-for="item in truckTypeList"
          :key="item.id"
          :label="item.name"
          :value="item.name"
        />
      </el-select>
    </el-form-item>
        <el-form-item label="车牌号码" prop="licensePlate">
          <el-input v-model="form.licensePlate" placeholder="请输入车牌号码" />
        </el-form-item>
        
        <el-form-item label="GPS设备id" prop="deviceGpsId">
          <el-input v-model="form.deviceGpsId" placeholder="请输入GPS设备id" />
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
import { listTruck, getTruck, delTruck, addTruck, updateTruck } from "@/api/management/truck";
import { listCheck } from "@/api/management/type";
export default {
  name: "Truck",
  data() {
    return {
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
      // 车辆管理表格数据
      truckList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        truckTypeId: null,
        truckTypeName: null,
        licensePlate: null,
        driverNum: null,
        driverName: null,
        deviceGpsId: null,
        allowableLoad: null,
        allowableVolume: null,
        status: null,
      },
      // 表单参数
      form: {
        id: null,
        truckTypeId: null, // 车辆类型ID
        truckTypeName: null, // 车辆类型名称
        licensePlate: null, // 车牌号
        deviceGpsId: null, // GPS设备ID
      },
      truckTypeList: [], // 存储车辆类型数据
      
      // 表单校验
      rules: {
        truckTypeName: [{ required: true, message: "请选择车辆类型名称", trigger: "change" }],
        licensePlate: [{ required: true, message: "请输入车牌号码", trigger: "blur" }],
        deviceGpsId: [{ required: true, message: "请输入GPS设备ID", trigger: "blur" }],
      }
    };
  },
  created() {
    this.getList();
    this.initTruckType();
  },

  methods: {
    //初始化车辆类型
    initTruckType(){

    listCheck().then(
        response => {
          console.log("车辆类型下拉",response);
          this.truckTypeList=response.data;
      }
      );
  },
   // 处理车辆类型选择
   handleTruckTypeChange(selectedName) {
      const selectedType = this.truckTypeList.find(item => item.name === selectedName);
      if (selectedType) {
        this.form.truckTypeId = selectedType.id; // 同步保存 ID
      }
    },

    /** 查询车辆管理列表 */
    getList() {
      this.loading = true;
      listTruck(this.queryParams).then(response => {
        this.truckList = response.rows.map(truck => {
      // 判断workStatus并修改为对应的文本
      truck.status = truck.status === 0 ? '可用' : '停用';
      return truck;
      });
        this.total = response.total;
        this.loading = false;
      });
      
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
        truckTypeId: null,
        truckTypeName: null,
        licensePlate: null,
        driverNum: null,
        driverName: null,
        deviceGpsId: null,
        allowableLoad: null,
        allowableVolume: null,
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
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加车辆管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getTruck(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改车辆管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateTruck(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTruck(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除车辆管理编号为"' + ids + '"的数据项？').then(function() {
        return delTruck(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/truck/export', {
        ...this.queryParams
      }, `truck_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
