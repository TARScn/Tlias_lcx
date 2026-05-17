package com.lcx.tlias_web_management.pojo;

import lombok.Data;

import lombok.AllArgsConstructor;

import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobOption {
    private List jobList;
    private List dataList;
}
