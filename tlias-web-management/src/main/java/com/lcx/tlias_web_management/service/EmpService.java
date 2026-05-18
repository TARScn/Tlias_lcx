package com.lcx.tlias_web_management.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.JobOption;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.LoginInfo;

public interface EmpService {
    /**
     * 分页条件查询员工数据
     */
    PageResult<Emp> page(Integer pageNum, Integer pageSize,
                         String name, Integer gender,
                         LocalDate begin, LocalDate end);

    /**
     * 根据ID查询员工
     */
    Emp getById(Integer id);

    /**
     * 新增员工
     */
    void add(Emp emp);

    /**
     * 更新员工
     */
    void update(Emp emp);

    /**
     * 根据ID删除员工
     */
    void deleteById(Integer id);

    /**
     * 批量删除员工
     */
    void deleteByIds(List<Integer> ids);

    /**
     * 统计员工职位人数
     * @return JobOption 包含职位列表和数据列表
     */
    JobOption countEmpJob();

    /**
     * 统计员工性别
     * @return List<Map> 包含性别和人数
     */
    List<Map<String, Object>> countEmpGender();

    /**
     * 登录验证
     * @return 登录成功返回员工信息，否则返回空
     */
    LoginInfo login(Emp emp);
}
