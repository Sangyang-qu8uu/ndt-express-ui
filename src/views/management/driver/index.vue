<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="司机账号" prop="driverAccount">
        <el-input v-model="queryParams.driverAccount" placeholder="请输入司机账号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="司机电话" prop="phone">
        <el-input v-model="queryParams.phone" placeholder="请输入司机电话" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="司机名字" prop="courierName">
        <el-input v-model="queryParams.courierName" placeholder="请输入司机名字" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:driver:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:driver:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:driver:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:driver:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="driverList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="司机账号" align="center" prop="driverAccount" />
      <el-table-column label="司机电话" align="center" prop="phone" />
      <el-table-column label="司机名字" align="center" prop="courierName" />
      <el-table-column label="工作状态" align="center" prop="workStatus" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:driver:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:driver:remove']">删除</el-button>
          <el-button size="mini" type="text" icon="el-icon-setting"
            @click="openBasicInfoDialog(scope.row)">证件信息维护</el-button>
        </template>
      </el-table-column>
    </el-table>


    <!-- 基本信息配置的对话框 -->
    <el-dialog title="证件信息维护" :visible.sync="dialogVisible" width="500px">
      <el-form :model="formData" ref="formData" label-width="120px">
        <el-form-item label="驾驶证号">
          <el-input v-model="formData.licenseNumber" />
        </el-form-item>
        <el-form-item label="准驾车型">
          <el-input v-model="formData.allowableType" />
        </el-form-item>
        <el-form-item label="驾龄">
          <el-input v-model="formData.driverAge" />
        </el-form-item>
        <el-form-item label="有效期限">
          <el-date-picker v-model="formData.validPeriod" type="date" format="yyyy-MM-dd" value-format="yyyy-MM-dd"
            align="right" />
        </el-form-item>
        <el-form-item label="驾驶证类型">
          <el-input v-model="formData.licenseType" />
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <image-upload v-model="formData.picture" @upload-success="handleUploadSuccess" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBasicInfo">保存</el-button>
      </div>
    </el-dialog>



    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改司机管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="司机账号" prop="driverAccount">
          <el-input v-model="form.driverAccount" placeholder="请输入司机账号" />
        </el-form-item>
        <el-form-item label="司机电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入司机电话" />
        </el-form-item>
        <el-form-item label="司机名字" prop="courierName">
          <el-input v-model="form.courierName" placeholder="请输入司机名字" />
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
import { listDriver, getDriver, delDriver, addDriver, updateDriver } from "@/api/management/driver";
import { addInfo, updateInfo, getInfo } from "@/api/management/info";
export default {
  name: "Driver",
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
      // 司机管理表格数据
      driverList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        driverAccount: null,
        phone: null,
        courierName: null,
        workStatus: null,
      },
      dialogVisible: false,  // 控制对话框显示
      formData: {  // 表单数据
        id:'',
        driverId: '',
        licenseNumber: '',  // 驾驶证号
        allowableType: '',  // 准驾车型
        driverAge: '',  // 驾龄
        validPeriod: '',  // 有效期限
        licenseType: '',  // 驾驶证类型
        picture: [],  // 图片列表
        flag: ''
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        workStatus: [
          { required: true, message: "工作状态不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询司机管理列表 */
    getList() {
      this.loading = true;
      listDriver(this.queryParams).then(response => {

        this.driverList = response.rows.map(driver => {
          // 判断workStatus并修改为对应的文本
          driver.workStatus = driver.workStatus === 0 ? '上班' : '休息';
          if(driver.driverInfoId){
            this.formData.id=driver.driverInfoId;
          }
         
          return driver;
        });
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
      this.resetBasic();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        driverAccount: null,
        phone: null,
        courierName: null,
        workStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null
      };
      this.resetForm("form");

    },

    //证件信息
    resetBasic() {
      this.formData = {
        id:'',
        driverId: '',
        licenseNumber: '',  // 驾驶证号
        allowableType: '',  // 准驾车型
        driverAge: '',  // 驾龄
        validPeriod: '',  // 有效期限
        licenseType: '',  // 驾驶证类型
        picture: [],  // 图片列表
        flag: ''
      };
      this.resetForm("formData");
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
      this.title = "添加司机管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getDriver(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改司机管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateDriver(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDriver(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除司机管理编号为"' + ids + '"的数据项？').then(function () {
        return delDriver(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/driver/export', {
        ...this.queryParams
      }, `driver_${new Date().getTime()}.xlsx`)
    },
    // 打开基本信息配置对话框
    openBasicInfoDialog(row) {

      this.dialogVisible = true;
      this.formData.driverId = row.id;
      this.formData.flag = row.flag;
        //如果是修改还需要回显
        if (this.formData.flag) {
       
        getInfo(this.formData.id).then(response => {
        this.formData = response.data;
        this.title = "修改证件基本信息";
        this.formData.flag = row.flag;
      });
      }
    },

    /** 基本信息维护提交按钮 */
    saveBasicInfo() {
    console.log(this.formData.flag)
      // 执行新增或更新操作
      const saveOrUpdate = this.formData.flag ? updateInfo : addInfo;
   
      const successMessage = this.formData.id != null ? "修改成功" : "新增成功";

      // 调用接口进行保存或更新
      saveOrUpdate(this.formData).then(response => {
        
        this.$modal.msgSuccess(successMessage);  // 显示成功消息
        this.dialogVisible = false;  // 关闭对话框
        this.getList();  // 刷新数据列表
      }).catch(error => {
        console.error(`${successMessage}失败：`, error);
      });
    },
    // 处理上传成功事件
    handleUploadSuccess(response) {
      if (response.code === 200) {
        // 确保 fileData 数组最多只能保存 2 个图片 URL
        if (this.formData.picture.length < 2) {
          this.formData.picture.push(response.data.url); // 将图片 URL 保存到 fileData 数组
        } else {
          this.$modal.msgError("最多只能上传两张图片");
        }
        console.log('文件上传成功:', response.data.url);
      } else {
        this.$modal.msgError('文件上传失败');
      }
    },

  }
};
</script>
