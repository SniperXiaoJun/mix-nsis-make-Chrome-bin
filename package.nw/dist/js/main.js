/**
 *
 * Created by Jonathan on 2016-12-9.
 */

"use strict";

/**
 * NPBank.dll 的封装类
 * @param id
 * @constructor
 */
function NPBank(id) {
  this.id = id;

  var embed = document.createElement("embed");
  embed.setAttribute('type', 'application/x-wtbank');
  embed.setAttribute('id', id);
  document.body.appendChild(embed);

  var me = this;
  var keyInjectListeners = [],
      keyEjectListeners = [];

  embed.onUKeyOn = function (resp) {
    console.log('NPBank onUkeyOn', resp);
    for (var i = 0; i < keyInjectListeners.length; i++) {
      keyInjectListeners[i].call(me);
    }
  };

  embed.onUKeyOff = function (resp) {
    console.log('NPBank onUKeyOff', resp);
    for (var i = 0; i < keyEjectListeners.length; i++) {
      keyEjectListeners[i].call(me);
    }
  };

  // 激活事件监测
  embed.addListenerSync();

  this.plugin = embed;
  this.keyInjectListeners = keyInjectListeners;
  this.keyEjectListeners = keyEjectListeners;
  this.deviceCertData = [];
}

//-----------------------------------------------------------
//----- 常量
//-----------------------------------------------------------

/**
 * 程序类型
 * @type {{DRIVER: number, PLUGIN: number}}
 */
NPBank.PROGRAM_TYPE = {
  DRIVER: 1,
  PLUGIN: 2
};


/**
 * 证书类型
 * @type {{RSA: number, SM2: number}}
 */
NPBank.CERT_TYPE = {
  RSA: 1,
  SM2: 2
};


/**
 * 事件类型
 * @type {{INJECT: number, EJECT: number}}
 */
NPBank.EVENT_TYPE = {
  INJECT: 1,
  EJECT: 2
};


//-----------------------------------------------------------
//-- 方法: 绑定事件
//-----------------------------------------------------------

/**
 * 添加事件监听
 * @param event
 * @param handler
 */
NPBank.prototype.addListener = function (event, handler) {
  if (event == NPBank.EVENT_TYPE.INJECT) {
    this.keyInjectListeners.push(handler);
  }
  else if (event == NPBank.EVENT_TYPE.EJECT) {
    this.keyEjectListeners.push(handler);
  }
};


/**
 * 清除事件监听
 * @param event
 * @param handler
 */
NPBank.prototype.removeListener = function (event, handler) {
  var listeners = event == 'keyInject' ? this.keyInjectListeners : this.keyEjectListeners;
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i] === handler) {
      listeners.slice(i, 1);
    }
  }
};


//-----------------------------------------------------------
//----- 方法：设备与证书
//-----------------------------------------------------------

/**
 * 读取设备和证书信息
 * WTF: 超级恶心的数据结构！
 *
 * @param callback
 *
 * 如果是 CSP 的设备，属性是这样的：
 *
 * [{
 *   "name": "0305339200000807",
 *   "devFrom" : "csp",
 *   "devNickName" : "9556809002340024",
 *   "serialNumber" : "unknow"
 *   "certs": [{},...]
 * },...]
 *
 *
 * 如果是 SKF 的设备，属性是这样的：
 *
 * [{
 *   "devAuthAlgId" : 16842752,
 *   "devFrom" : "skf",
 *   "devNickName" : "0305549100001236",
 *   "firmwareVersion.major" : 49,
 *   "firmwareVersion.minor" : 48,
 *   "freeSpace" : 2424832,
 *   "hwVersion.major" : 49,
 *   "hwVersion.minor" : 48,
 *   "issuer" : "CMBC",
 *   "label" : "CMBC",
 *   "manufacturer" : "HB",
 *   "serialNumber" : "5330000238036648",
 *   "totalSpace" : 3604480,
 *   "version.major" : 49,
 *   "version.minor" : 48
 *   "certs": [{},...]
 * },...]
 *
 *
 * 注意哦，属性名不只大小写无规则，而且是
 *    动态变的！
 *    动态变的！
 *    动态变的！
 * 根据 “devFrom” 不同而不同，这是数组吗？！
 *
 *
 * certs 数据中证书的结构为：
 *  {
 *    "certContentB64String" : "",
 *    "commonName" : "9556809002340024",
 *    "issuer" : "O=CFCA TEST CA",
 *    "notAfter" : "2017-06-13 10:51:42",
 *    "notBefore" : "2017-03-13 10:51:42",
 *    "serialNumber" : "78 34 4D 2D 02 D6 BF 5C A3 D7 F2 47 5E D8 1A 39 ",
 *    "signType" : 1,
 *    "subject" : "CN=9556809002340024",
 *    "type" : 1,
 *    "verify" : 2
 *  }
 *
 *  所以，当你判断用户用的是什么设备时，
 *
 *  如果是 NULL, 就认为没插入设备; (JSON结构还能返回null？)
 *  如果全是 CSP 设备，就认为是 CSP 设备;
 *  如果全是 SKF 设备，就认为是 SKF 设备;
 *  如果既有 SKF 又有 CSP 设备，那你就自己决定吧！！！
 *
 */
NPBank.prototype.readDeviceAndCert = function (callback) {
  console.log('NPBank readDeviceAndCert');
  var me = this;
  this.plugin.readUkeyCertInfo(function (resp) {
    me.deviceCertData = JSON.parse(resp);
    callback.call(me, me.deviceCertData);
  });
};



NPBank.prototype.readDevice = function (callback) {
  console.log('NPBank readDevice');
  var me = this;
  this.plugin.readUkeyInfo(function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 验证设备密码
 * @param b64DeviceData
 * @param password
 * @param callback
 */
NPBank.prototype.verifyDevicePassword = function (b64DeviceData, password, callback) {
  this.plugin.verifyDevPassword(b64DeviceData, password, callback);
};


/**
 * 修改证书
 * @param b64DeviceData
 * @param oldPassword
 * @param password
 * @param callback
 */
NPBank.prototype.changeDevicePassword = function (b64DeviceData, oldPassword, password, callback) {
  this.plugin.changeUkeyPassword(b64DeviceData, oldPassword, password, function (resp) {
    callback.call(this, JSON.parse(resp));
  });
};


/**
 * 弹出证书显示窗口
 * @param cert
 */
NPBank.prototype.showCert = function (cert) {
  if (!cert['certContentB64String']) {
    return;
  }
  this.plugin.showCert(cert['certContentB64String']);
};


/**
 * 安装证书
 * @param certFiles
 * @param certType
 * @param callback
 */
NPBank.prototype.installCACert = function (certFiles, certType, callback) {
  certFiles = $.isArray(certFiles) ? certFiles : [certFiles];
  var me = this;
  if (certType == NPBank.CERT_TYPE.RSA) {
    this.plugin.installCaCertRSA(certFiles.join(','), function (resp) {
      callback.call(me, JSON.parse(resp));
    });
  }
  else if (certType == NPBank.CERT_TYPE.SM2) {
    this.plugin.installCaCertSM2(certFiles.join(','), function (resp) {
      callback.call(me, JSON.parse(resp));
    });
  }
};


/**
 * 通过属性/值查询证书
 * @param property
 * @param value
 * @param callback
 */
NPBank.prototype.getCert = function (property, value, callback) {
  var me = this;

  function foundCert(deviceCertData, callback) {
    var cert = false;
    for (var i = 0, deviceCount = deviceCertData.length; i < deviceCount; i++) {
      var certs = deviceCertData[i]['certs'];

      for (var j = 0, certCount = certs.length; j < certCount; j++) {
        // found it
        if (certs[j][property] == value) {
          cert = certs[j];
          break;
        }
      }
      if (cert) break;
    }
    callback.call(me, cert);
  }

  if (this.deviceCertData.length > 0) {
    foundCert(me.deviceCertData, callback);
  }
  else {
    me.readDeviceAndCert(function (deviceCertData) {
      foundCert(deviceCertData, callback);
    })
  }
};


//-----------------------------------------------------------
//----- 安全检测
//-----------------------------------------------------------


/**
 * 列出本地文件的版本
 * @param filePath
 * @param callback
 */
NPBank.prototype.checkVersion = function (filePath, callback) {
  this.plugin.getLocalFileVersion(filePath, callback);
};


/**
 * 检查系统信息
 * @returns {*}
 */
NPBank.prototype.checkSystemInfo = function () {
  return JSON.parse(this.plugin.detectSystem());
};


/**
 * 检查杀毒软件
 * @returns {*}
 */
NPBank.prototype.checkAntivirus = function () {
  return JSON.parse(this.plugin.detectAntivirus());
};


/**
 * 检查防火墙
 * @returns {*}
 */
NPBank.prototype.checkFirewall = function () {
  return JSON.parse(this.plugin.detectFireWall());
};


NPBank.prototype.checkTime = function (callback) {
  var me = this;
  this.plugin.detectTime(function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 检查 HOST 文件
 * @param callback
 */
NPBank.prototype.checkHost = function (host, callback) {
  var me = this;
  this.plugin.detectHost(host, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};

/**
 * 检查银行网站是否可连通
 * @param callback
 */
NPBank.prototype.checkBankWebsite = function (host, subsite, port, callback) {
  var me = this;
  this.plugin.detectBankWebsite(host, subsite, port, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 检查证书链
 * @param certs
 * @param certType
 * @param callback
 */
NPBank.prototype.checkCertChain = function (certs, certType, callback) {
  var me = this;
  certs = $.isArray(certs) ? certs : [certs];

  this.plugin.checkCertChain(certs.join(','), certType, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 列出 SKF 驱动
 * @param name
 * @param callback
 */
NPBank.prototype.checkSKFDriver = function (name, callback) {
  var me = this;
  this.plugin.listSKFDriver(name, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 列出系统控件
 * @param name
 * @param callback
 */
NPBank.prototype.checkSystemControl = function (name, callback) {
  this.plugin.listSystemControl(name, callback);
};


/**
 * 检查插件
 * @param name
 * @returns {boolean}
 */
NPBank.prototype.checkPlugin = function (name) {
  for (var i = 0; i < navigator.plugins.length; i++) {
    if (navigator.plugins[i].name.indexOf(name) != -1) {
      return true;
    }
  }
  return false;
};

/**
 * 安装程序或补丁
 * @param programPath
 * @param cmdArgs
 * @param programType
 * @param callback
 */
NPBank.prototype.installApplication = function (programPath, cmdArgs, programType, callback) {
  var me = this;
  this.plugin.installApp(programPath, cmdArgs, programType, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};


/**
 * 修复 HOST 文件
 * @param domain
 * @param callback
 */
NPBank.prototype.repairHostFile = function (domain, callback) {
  var me = this;
  this.plugin.repairHostFile(domain, function (resp) {
    callback.call(me, JSON.parse(resp));
  });
};
/**
 * Created by Jonathan on 2016-12-11.
 */
var app = new function() {
  var me = this;
  this.observers = [];

  this.LOGIN_URL = 'https://111.205.207.143:55902/eweb/static/login.html';
  this.CSP_LOGIN_URL = 'https://111.205.207.143:8443/eweb/static/loginKey.html';
  this.SKF_LOGIN_URL = 'https://111.205.207.146/eweb/static/loginKey.html';

  this.register = function (observer){
    me.observers.push(observer);
  };

  this.unregister = function (observer) {
    for(var i=0; i<me.observers.length; i++){
      if (observer === me.observers[i]){
        me.observers.slice(i,1);
        break;
      }
    }
  };

  this.notify = function (eventName, data) {
    var event = {
      name: eventName,
      data: data
    };

    for(var i=0; i<me.observers.length; i++){
      var observer = me.observers[i];
      if (observer['update']){
        observer.update(event);
      }
    }
  };

  function clearCache(){
    chrome.browsingData.remove({
      "since": 0  //remove all browsing data
    }, {
      "appcache": true,
      "cache": true,
      "cookies": true,
      "downloads": true,
      "fileSystems": true,
      "formData": true,
      "history": true,
      "indexedDB": true,
      "localStorage": true,
      "pluginData": true,
      "passwords": true,
      "webSQL": true
    }, function () {
    });
  }
  
  function onKeyEject() {
    console.log('app eject', arguments);
    me.notify('keyEject');

    clearCache();

    $.confirm({
      text: "U宝已弹出，为保证安全，请您关闭客户端！",
      confirmButton: "关闭客户端",
      cancelButton: false,
      confirm: function(button) {
        win.close();
      }
    });
  }

  function onKeyInject() {
    console.log('app inject', arguments);
    me.notify('keyInject');
    readUkey();
  }

  function readUkey() {
    me.keyPlugin.readDeviceAndCert(function (deviceCertData) {
      console.log('app readUkey', arguments);
      me.notify('deviceCertUpdate', deviceCertData);
    })
  }


  var loadingTimeout = null;

  this.freezeScreen = function (msg, callback) {
    $.isLoading({text: msg});

    loadingTimeout = setTimeout(function () {
      $.isLoading("hide");
      if (callback)
        callback.call();
    }, 60000);
  };


  this.releaseScreen = function releaseScreen() {
    clearTimeout(loadingTimeout);
    $.isLoading("hide");
  };
  
  this.init = function () {
    me.keyPlugin = new NPBank('key-plugin');

    me.keyPlugin.addListener(NPBank.EVENT_TYPE.INJECT, onKeyInject);

    me.keyPlugin.addListener(NPBank.EVENT_TYPE.EJECT, onKeyEject);

    win.on('close', function(event) {
      clearCache();

	  var exec = require('child_process').exec;
	  var path = require('path');
	  var process = require('process');
	  
	  exec('taskkill /f /im ' + path.basename(process.execPath));
	  
      win.close(true);
    });

    // 初始化先读一次UKey
    readUkey();
  }
};

var Network = function () {

  function clearCache() {
    chrome.browsingData.remove({
      "since": 0  //remove all browsing data
    }, {
      "appcache": true,
      "cache": true,
      "cookies": true,
      "downloads": true,
      "fileSystems": true,
      "formData": true,
      "history": true,
      "indexedDB": true,
      "localStorage": true,
      "pluginData": true,
      "passwords": true,
      "webSQL": true
    }, function () {
      toastr.success('缓存清除成功！');
    });
  }

  function setProxy(host, port, name, password) {
    var config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: host,
          port: port
        },
        bypassList: []
      }
    };

    chrome.proxy.settings.set({
      value: config,
      scope: 'regular'
    }, function () {
    });
  }


  function setExitClear(clearCacheAfterExit) {
    localStorage.clearCacheAfterExit = this.checked;
  }

  // 暴露接口
  return {
    setExitClear: setExitClear,
    clearCache: clearCache,
    setProxy: setProxy
  }

}();

/**
 * 目前屏蔽了每个危险项的修改，只提供一键全部修复
 *
 * @type {securePage}
 * 
 * 1.RSA检测1（测试）
 * 4672dc25729f024e5583b580f90bdbe993b3f445
 * 修复：
 * cfca_test_ca.cer
 * cfca_test_gt_rca.cer
 *
 * 2.RSA检测2（测试）
 * cfdf99fb86221613392c075e8e3d772bb969ef8e
 * cfca_rsa_1.cer
 * cfca_rsa_2.cer
 *
 * 3.RSA检测3（正式）
 * d1dbe98882e5dd1a8f4caa008cbe7cf2ab1bf6d9
 * CFCA_RSA_NORMAL_1.cer
 * CFCA_RSA_NORMAL_2.cer
 *
 * 4.SM2检测1(测试)
 * e27eb610bb94eb15e6aed1150affe8d7a057399d
 * cfca_sm2_1.cer
 * cfca_sm2_2.cer
 *
 * 5.SM2检测2(正式)
 * 5c9358205a247356101b645010ece9a7ca074111
 * CFCA_SM2_NORMAL_0.cer
 * CFCA_SM2_NORMAL_1.cer
 * CFCA_SM2_NORMAL_2.cer
 *
 */

"use strict";

var securePage = new function () {

  /**
   * 检查的项目列表
   *
   * @type {{SYSTEM: number, TIME: number, ANTIVIRUS: number, FIREWALL: number, TRUST_SITE: number, UNTRUST_SITE: number, WEBSITE: number, HOST: number, SYSTEM_PATCH: number, SM2_CERT: number, RSA_CERT: number, UKEY_DRIVER: number, PLUGIN: number}}
   */
  var kDetectID = {
    'SYSTEM': 0,
    'TIME': 1,
    'ANTIVIRUS': 2,
    'FIREWALL': 3,
    'TRUST_SITE': 4,
    'UNTRUST_SITE': 5,
    'WEBSITE': 6,
    'HOST': 7,
    'SYSTEM_PATCH': 8,
    'SM2_CERT': 9,
    'RSA_CERT': 10,
    'UKEY_DRIVER': 11,
    'PLUGIN': 12
  };


  var startButton = $('#start-btn'),
      cancelButton = $('#cancel-btn'),
      fixAllButton = $('#fix-all-btn'),
      restartButton = $('#restart-btn'),
      infoEl = $('.top-title p'),
      sliderEl = $('.slider .thumb'),
      titleEl = $('.top-title h3'),
      dangerCountEl = $('.danger-title .itemCount'),
      warningCountEl = $('.warning-title .itemCount'),
      safeCountEl = $('.safe-title .itemCount'),
      dangerCtEl = $('.danger-list'),
      warningCtEl = $('.warning-list'),
      safeCtEl = $('.safe-list');


  /**
   * 检查数量统计
   */
  var me = this,
      plugin = null,
      isRunning = false,  // 是否正在执行扫描
      dangerCount = [],
      warningCount = [],
      safeCount = [],
      fixedCount = 0,
      fixedFinished = 0,
      resultQueue = [],
      resultIndex = 0,
      resultTimer = null,
      needRestartBrowser = false,
      listNameLength = 64;

  const path = require('path');



  //-----------------------------------------------------------
  //-- 安全检测
  //-----------------------------------------------------------

  function detectSystemInfo() {
    var sysInfo = plugin.checkSystemInfo();
    var task = enqueueTask('操作系统', function () {
      if (sysInfo['success']) {
        addSafeResult(kDetectID.SYSTEM, '系统：' + sysInfo['sysinfo'])
      } else {
        addWarningResult(kDetectID.SYSTEM, '检测系统失败');
      }
    });
    task.finished = true;
  }


  function detectAntivirus() {
    var antiVirus = plugin.checkAntivirus();
    var task = enqueueTask('杀毒软件', function () {
      if (antiVirus['success']) {
        addSafeResult(kDetectID.ANTIVIRUS, '已经安装杀毒软件：' + antiVirus['product_name']);
      } else {
        addWarningResult(kDetectID.ANTIVIRUS, '没有检测到杀毒软件');
      }
    });
    task.finished = true;
  }


  function detectFirewall() {
    var fireWall = plugin.checkFirewall();
    var task = enqueueTask('防火墙', function () {
      if (fireWall['success']) {
        addSafeResult(kDetectID.FIREWALL, '防火墙设置正常');
      } else {
        addWarningResult(kDetectID.FIREWALL, '防火墙设置异常');
      }
    });
    task.finished = true;
  }


  function detectHost(host) {
    var task = enqueueTask('检查系统HOST文件', false);
    plugin.checkHost(host, function (result) {
      task.result = function () {
        if (!result['success']) {
          addSafeResult(kDetectID.HOST, 'HOST 文件正常');
        } else {
          addDangerResult(kDetectID.HOST, 'HOST 文件存在劫持风险');
        }
      };
      task.finished = true;
    });
  }


  function detectRSACertChain(certs) {
    var task = enqueueTask('检测 RSA 证书链', false);
    plugin.checkCertChain(certs, NPBank.CERT_TYPE.RSA, function (result) {
      task.result = function () {
        if (result['success']) {
          addSafeResult(kDetectID.RSA_CERT, 'RSA 证书链正常');
        } else {
          addDangerResult(kDetectID.RSA_CERT, 'RSA 证书链异常');
        }
      };
      task.finished = true;
    });
  }


  function detectSM2CertChain(certs) {
    var task = enqueueTask('检测 SM2 证书链', false);
    plugin.checkCertChain(certs, NPBank.CERT_TYPE.SM2, function (result) {
      task.result = function () {
        if (result['success']) {
          addSafeResult(kDetectID.SM2_CERT, 'SM2 证书链正常');
        } else {
          addDangerResult(kDetectID.SM2_CERT, 'SM2 证书链异常');
        }
      };
      task.finished = true;
    });
  }


  function detectSKFDriver(name) {
    var task = enqueueTask('检测U宝驱动', false);
    plugin.checkSKFDriver(name, function (resultDriver) {
      task.result = function () {
        if (resultDriver[0]['skf_state']) {
          addSafeResult(kDetectID.UKEY_DRIVER, '驱动（' + name.substr(0, listNameLength) + '）正常');
        } else {
          addDangerResult(kDetectID.UKEY_DRIVER, '驱动（' + name.substr(0, listNameLength) + '）未正确安装');
        }
      };
      task.finished = true;
    });
  }


  function detectPlugin(name) {
    var result = plugin.checkPlugin(name);
    var task = enqueueTask('检测 CFCA 插件', function () {
      if (result) {
        addSafeResult(kDetectID.PLUGIN, 'CFCA 插件（' + name.substr(0, listNameLength) + '）正常');
      } else {
        addDangerResult(kDetectID.PLUGIN, 'CFCA 插件（' + name.substr(0, listNameLength) + '）未正确安装');
      }
    });
    task.finished = true;
  }


  /**
   * 检查时间同步
   * @param resp
   */
  function detectTime(resp) {
    var task = enqueueTask('系统时间', false);
    plugin.checkTime(function (sysTime) {
      task.result = function () {
        if (sysTime['success']) {
          addSafeResult(kDetectID.TIME, '系统时间同步：' + sysTime['local_time_str']);
        } else {
          addWarningResult(kDetectID.TIME, '系统时间不同步');
        }
      };
      task.finished = true;
    });
  }


  /**
   * 检查银行链接
   *
   * @param host
   * @param path
   * @param port
   */
  function detectBankWebsite(host, path, port) {
    var task = enqueueTask('网银链接', false);
    plugin.checkBankWebsite(host, path, port, function (result) {
      task.result = function () {
        if (result['success']) {
          addSafeResult(kDetectID.WEBSITE, '网银链接正常');
        } else {
          addWarningResult(kDetectID.WEBSITE, '网银链接不可用');
        }
      };
      task.finished = true;
    });
  }


  //-----------------------------------------------------------
  //-- 修复
  //-----------------------------------------------------------

  function fixCACertSM2(certs, element) {
    certs = $.isArray(certs) ? certs : [certs];

    var certFiles = [];
    for (var i = 0; i < certs.length; i++) {
      certFiles.push(getResourcePath('cert/' + certs[i]));
    }

    console.log('[fixCACertSM2]', certFiles);
    plugin.installCACert(certFiles, NPBank.CERT_TYPE.SM2, function (resultCert) {
      console.log('[fixCACertSM2 callback]', resultCert);
      if (resultCert['success']) {
        updateWarningAndDangerUI(true, element);
        checkAllFixingFinished(true);
      }
      else {
        updateWarningAndDangerUI(false, element, resultCert['msg']);
        checkAllFixingFinished(false);
      }

    });


    // var fixedCount = 0;
    // var fixedFinished = 0;
    // var msg = '';
    //
    // for (var i = 0; i < certs.length; i++) {
    //   console.log('[fixCACertSM2]', getResourcePath('cert/' + certs[i]));
    //   plugin.installCACert(getResourcePath('cert/' + certs[i]), NPBank.CERT_TYPE.SM2, function (resultCert) {
    //     fixedFinished++;
    //
    //     if (resultCert['success']) {
    //       fixedCount++;
    //     }
    //     else {
    //       msg += resultCert['msg'] + '<br>';
    //     }
    //
    //     // 安装完全部证书才显示修改成功
    //     if (fixedFinished == certs.length) {
    //       var allFixed = (fixedFinished==fixedCount);
    //       checkAllFixingFinished(allFixed);
    //       updateWarningAndDangerUI(allFixed, element, msg);
    //     }
    //   });
    // }
  }


  function fixCACertRSA(certs, element) {
    certs = $.isArray(certs) ? certs : [certs];

    var certFiles = [];
    for (var i = 0; i < certs.length; i++) {
      certFiles.push(getResourcePath('cert/' + certs[i]));
    }

    console.log('[fixCACertRSA]', certFiles);

    plugin.installCACert(certFiles, NPBank.CERT_TYPE.RSA, function (resultCert) {
      console.log('[fixCACertRSA callback]', resultCert);
      if (resultCert['success']) {
        updateWarningAndDangerUI(true, element);
        checkAllFixingFinished(true);
      }
      else {
        updateWarningAndDangerUI(false, element, resultCert['msg']);
        checkAllFixingFinished(false);
      }
    });

    // var fixedCount = 0;
    // var fixedFinished = 0;
    // var msg = '';
    //
    // for (var i = 0; i < certs.length; i++) {
    //   console.log('[fixCACertRSA]', getResourcePath('cert/' + certs[i]));
    //   plugin.installCACert(getResourcePath('cert/' + certs[i]), NPBank.CERT_TYPE.RSA, function (resultCert) {
    //     fixedFinished++;
    //
    //     if (resultCert['success']) {
    //       fixedCount++;
    //     }
    //     else {
    //       msg += resultCert['msg'] + '<br>';
    //     }
    //
    //     // 安装完全部证书才显示修改成功
    //     if (fixedFinished == certs.length) {
    //       var allFixed = (fixedFinished==fixedCount);
    //       checkAllFixingFinished(allFixed);
    //       updateWarningAndDangerUI(allFixed, element, msg);
    //     }
    //   });
    // }
  }


  function fixDriver(element) {
    var drivers = ['CMBC.exe', 'CMBC_HB_UranuSafe_Install.exe'];
    var fixedCount = 0;
    var fixedFinished = 0;
    var msg = '';

    for (var i = 0; i < drivers.length; i++) {
      console.log('[fixDriver-'+i+']', getResourcePath('bin/driver/' + drivers[i]));
      plugin.installApplication(getResourcePath('bin/driver/' + drivers[i]), '/S', NPBank.PROGRAM_TYPE.DRIVER, function (result) {
        fixedFinished++;

        if (result['success']) {
          fixedCount++;
        }
        else {
          msg += result['msg'] + '<br>';
        }

        // 安装完全部证书才显示修改成功
        if (fixedFinished == drivers.length) {
          var allFixed = (fixedFinished==fixedCount);
          checkAllFixingFinished(allFixed);
          updateWarningAndDangerUI(allFixed, element, msg);
        }
      });
    }
  }


  function fixPlugin(element) {
    console.log('[fixPlugin]', getResourcePath('bin/plugin/CryptoKit.CMBC.QIYE.exe'));
    plugin.installApplication(getResourcePath('bin/plugin/CryptoKit.CMBC.QIYE.exe'), "/S", NPBank.PROGRAM_TYPE.DRIVER, function (resultApp) {
      if (!resultApp['success']) {
        updateWarningAndDangerUI(false, element, resultApp['msg']);
        checkAllFixingFinished(false);
      }
      else {
        needRestartBrowser = true;
        updateWarningAndDangerUI(true, element);
        checkAllFixingFinished(true);
      }

    });
  }


  function fixHostFile(domain, element) {
    plugin.repairHostFile(domain, function (resultHost) {
      if (resultHost['success']) {
        updateWarningAndDangerUI(true, element);
        checkAllFixingFinished(true);
      }
      else {
        updateWarningAndDangerUI(false, element, resultApp['msg']);
        checkAllFixingFinished(false);
      }

    });
  }


  //-----------------------------------------------------------
  //-- 处理检测结果
  //-----------------------------------------------------------

  /**
   * 检测到危险的项目
   * @param id
   * @param title
   * @param detailCallback
   * @param fixCallback
   */
  function addDangerResult(id, title, detailCallback, fixCallback) {
    if (!isRunning) return;

    // 如果是没有安装杀软，不加入待修复列表
    //if (id != kDetectID.ANTIVIRUS){
    dangerCount.push(id);
    //}

    var itemHtml = $('<li class="detect-item-' + id + ' clearfix"><span class="d-info">' + title + '</span><a class="btn btn-xs btn-danger pull-right">异常</a></li>');

    if (detailCallback) {
      itemHtml.append('<a class="btn btn-xs btn-info pull-right">详情</a>');
      itemHtml.find('.btn-info').click(detailCallback);
    }

    if (fixCallback) {
      itemHtml.append('<a class="btn btn-xs btn-success pull-right">修复</a>');
      itemHtml.find('.btn-success').click(fixCallback);
    }

    dangerCountEl.text(dangerCount.length);
    itemHtml.hide().appendTo(dangerCtEl).slideDown('slow');
  }


  /**
   * 检测到有风险的项目
   * @param id
   * @param title
   * @param detailCallback
   * @param fixCallback
   */
  function addWarningResult(id, title, detailCallback, fixCallback) {
    if (!isRunning) return;
    warningCount.push(id);
    var itemHtml = $('<li class="detect-item-' + id + ' clearfix"><span class="d-info">' + title + '</span><a class="btn btn-xs btn-warning pull-right">警告</a></li>');

    if (detailCallback) {
      itemHtml.append('<a class="btn btn-xs btn-info pull-right">详情</a>');
      itemHtml.find('.btn-info').click(detailCallback);
    }
    if (fixCallback) {
      itemHtml.append('<a class="btn btn-xs btn-success pull-right">修复</a>');
      itemHtml.find('.btn-success').click(fixCallback);
    }

    warningCountEl.text(warningCount.length);
    itemHtml.hide().appendTo(warningCtEl).slideDown('slow');
  }


  /**
   * 检测到安全的项目
   * @param id
   * @param title
   * @param detailCallback
   */
  function addSafeResult(id, title, detailCallback) {
    if (!isRunning) return;
    safeCount.push(id);
    var itemHtml = $('<li class="detect-item-' + id + ' clearfix"><span class="d-info">' + title + '</span><a class="btn btn-xs btn-success pull-right">正常</a></li>');
    if (detailCallback) {
      itemHtml.append('<a class="btn btn-xs btn-info pull-right">详情</a>');
      itemHtml.find('.btn-info').click(detailCallback);
    }

    safeCountEl.text(safeCount.length);
    itemHtml.hide().appendTo(safeCtEl).slideDown('slow');
  }


  /**
   * 处理检测的结果
   */
  function handleResultQueue() {

    var displayedCount=0, startedIndex=0;

    var handleOne = function () {

      for (var i=0; i<resultQueue.length; i++){
        var task = resultQueue[i];
        if(!task.started){
          task.started = true;
          startedIndex++;
          infoEl.text('正在检测第 '+startedIndex+' 项：' + task.title);
          break;
        }
      }


      for (var i=0; i<resultQueue.length; i++){
        var task = resultQueue[i];
        if(task.finished && !task.displayed){
          // 显示结果
          task.displayed = true;
          displayedCount++;

          sliderEl.animate({
            width: Math.ceil(displayedCount / resultQueue.length * 100) + '%'
          }, 500);

          task['result'].call();
          break;
        }
      }

      // // 当有下一个结果时，提示下一项
      // if (resultQueue.length > 1) {
      //   resultQueue = resultQueue.slice(1);
      //
      //   infoEl.text('正在检测第 ' + (resultIndex + 1) + ' 项：' + resultQueue[0]['title']);
      //   sliderEl.animate({
      //     width: Math.ceil(resultIndex / total_detection * 100) + '%'
      //   }, 500);
      // }

      // 全部检测结束
      if (displayedCount == resultQueue.length) {
        clearInterval(resultTimer);
        showDetectionStatistics();
      }
    };

    handleOne();

    resultTimer = setInterval(handleOne, 1000);
  }


  /**
   * 全部检测完成，统计并显示结果
   */
  function showDetectionStatistics() {
    // 重新检测按钮
    restartButton.siblings().hide();
    restartButton.show();
    // 如果有问题显示一键修复按钮
    if (dangerCount.length > 0) {
      fixAllButton.show();
    }
    titleEl.text('全部完成');
    infoEl.text('一共检测 ' + resultQueue.length + ' 项，发现 ' + dangerCount.length + ' 项异常');
    sliderEl.animate({
      width: '100%'
    }, 500);
    isRunning = false;
    // app.releaseScreen();
    // toastr.success('检测完成！');
  }


  //-----------------------------------------------------------
  //-- 其它
  //-----------------------------------------------------------

  /**
   * 将任务入队
   * @param name
   * @param handler
   */
  function enqueueTask(name, handler) {

    var task = {
      title: name,
      started: false,
      finished: false,
      displayed: false,
      result: handler
    };
    resultQueue.push(task);
    return task;
  }


  /**
   *
   */
  function restartAfterRepairing() {
    $.confirm({
      text: "现在需要您重启客户端来完成一键修复。",
      confirm: function () {
        win.reload();
      },
      confirmButton: "立即重启",
      cancelButton: "手动重启"
    });
  }


  function getResourcePath(file) {
    return path.resolve(global.__dirname + "/dist/" + file);
  }


  function updateWarningAndDangerUI(success, element, msg) {
    if (success){
      element.find('.btn-danger,.btn-warning').text('已修复').removeClass('btn-danger btn-warning').addClass('btn-success');
    }
    else {
      //var span = element.find('span.d-info');
      element.append( '<p>'+msg+'</p>' );
    }
  }


  /**
   * 重置检测参数
   */
  function reset() {

    // 重置结果队列
    isRunning = false;
    dangerCount = [];
    warningCount = [];
    safeCount = [];
    fixedCount = 0;
    resultQueue = [];
    resultIndex = 0;
    clearInterval(resultTimer);

    // 重置插件对象
    var id = plugin ? plugin.id : 'secure-plugin';
    $('#' + id).remove();
    plugin = new NPBank(id);


    // 重置 UI
    dangerCtEl.empty();
    warningCtEl.empty();
    safeCtEl.empty();
    dangerCountEl.text(dangerCount.length);
    warningCountEl.text(warningCount.length);
    safeCountEl.text(safeCount.length);
    sliderEl.css({
      width: '0%'
    });
    titleEl.text('为您的网银环境体检');
    infoEl.text('');
    $('.summary').hide();
    $('.detecting').show();
  }


  function checkAllFixingFinished(success) {

    fixedFinished++;

    if (success){
      fixedCount++;
    }

    if (fixedFinished == dangerCount.length) {
      app.releaseScreen();

      if (fixedCount==fixedFinished){
        toastr.success('已经全部修复完成！');
      }
      else {
        toastr.warning('部分修复完成，请您检查失败项！');
      }

      if (needRestartBrowser) {
        restartAfterRepairing();
      }

    }
  }


  /**
   * 启动全部检测
   * 包括同步返回结果的，异步返回结果的
   */
  this.doSecureDetecting = function () {
    if (isRunning) return;

    // app.freezeScreen('安全检测中，请稍候...');

    isRunning = true;
    cancelButton.siblings().hide();
    cancelButton.show();
    titleEl.text('正在为您的网银环境体检');


    // 检测系统
    detectSystemInfo();
    // 系统杀毒软件
    detectAntivirus();
    // 防火墙
    detectFirewall();
    // 检查HOST文件
    detectHost('ent.cmbc.com.cn');
    // 检查RSA证书链
    detectRSACertChain([
      '4672dc25729f024e5583b580f90bdbe993b3f445',
      'd1dbe98882e5dd1a8f4caa008cbe7cf2ab1bf6d9',
      'cfdf99fb86221613392c075e8e3d772bb969ef8e'
    ]);
    // 检查SM2证书链
    detectSM2CertChain([
      '5c9358205a247356101b645010ece9a7ca074111',
      'e27eb610bb94eb15e6aed1150affe8d7a057399d'
    ]);
    // 检测驱动
    detectSKFDriver('hbcmbc');
    // 检查插件
    detectPlugin("CFCA CryptoKit CMBC UKeyCheck 3.0");
    detectPlugin("CFCA CryptoKit CMBC 3.2");
    detectPlugin("CFCA CryptoKit CMBC U2 3.0");
    // 检查网银站点
    detectBankWebsite('111.205.207.143', 'eweb/static/login.html', 55902);


    handleResultQueue();
  };


  /**
   * 一键修复检测到的错误
   */
  this.fixDetectedVulnerabilities = function () {
    // 只修复危险项
    // var waitingFixList = dangerCount.concat(warningCount);
    var waitingFixList = dangerCount;
    fixedCount = 0;
    fixedFinished = 0;

    app.freezeScreen('修复中，请稍候...');

    for (var i = 0, len = waitingFixList.length; i < len; i++) {
      var liEl = $('.detect-item-' + waitingFixList[i]);

      liEl.find('p').remove();

      // 如果没有危险或警告的项目标签，表示已经被修复。
      // 类型相同的项目一起修改，比如修改CA证书会一次安装所有缺少的证书。
      if (liEl.find('.btn-danger,.btn-warning').length == 0) {
        continue;
      }

      switch (waitingFixList[i]) {
        case kDetectID.SM2_CERT:
          fixCACertSM2([
            'CFCA_SM2_1.cer',
            'CFCA_SM2_2.cer',
            'CFCA_SM2_NORMAL_0.cer',
            'CFCA_SM2_NORMAL_1.cer',
            'CFCA_SM2_NORMAL_2.cer'
          ], liEl);
          break;
        case kDetectID.RSA_CERT:
          fixCACertRSA([
            'cfca_test_ca.cer',
            'cfca_test_gt_rca.cer',
            'CFCA_RSA_1.cer',
            'CFCA_RSA_2.cer',
            'CFCA_RSA_NORMAL_1.cer',
            'CFCA_RSA_NORMAL_2.cer'
          ], liEl);
          break;
        case kDetectID.UKEY_DRIVER:
          fixDriver(liEl);
          break;
        case kDetectID.PLUGIN:
          fixPlugin(liEl);
          break;
        case kDetectID.HOST:
          fixHostFile("win-trust.cn", liEl);
          break;
        case kDetectID.ANTIVIRUS:
          liEl.find('.btn-danger,.btn-warning').text('请安装杀毒软件');
          break;
        default:
          break;
      }
    }
  };


  this.update = function (e) {
  };


  this.init = function () {
    app.register(this);


    $('#cancel-btn').click(function () {
      reset();
      restartButton.siblings().hide();
      restartButton.show();
    });

    $('#fix-all-btn').click(function () {
      me.fixDetectedVulnerabilities();
    });

    $('#start-btn,#restart-btn').click(function () {
      reset();
      me.doSecureDetecting();
    });
  }
};
/**
 * Created by Jonathan on 2016-12-11.
 */

var homePage = new function () {

  function switchLoginPage(keyType){
    if ($('#page-home iframe').length>0){
      var currentSrc = $('#page-home iframe').prop('src');
	  
	  
	  

      // 只在登录页面做切换处理
      if (currentSrc != app.CSP_LOGIN_URL && currentSrc != app.SKF_LOGIN_URL && currentSrc != app.LOGIN_URL) {
        return;
      }

      $('#page-home').html();
    }

    var src = keyType ? ( keyType=='SKF'? app.SKF_LOGIN_URL : app.CSP_LOGIN_URL ) : app.LOGIN_URL;

	//alert("\nkeyType=" + keyType +"\nsrc=" + src + "\ncurrentSrc="+ currentSrc);
	
    $('#page-home').html('<iframe id="browser" name="'+ Date.now() +'" src="'+src+'" nwfaketop nwdisable></iframe>');
  }


  this.init = function () {
    app.register(this);
  };


  this.update = function (e) {
    if (e.name == 'keyInject'){
      //switchLoginPage(true);
    }
    else if (e.name == 'keyEject'){
      switchLoginPage(false);
    }
    else if (e.name == 'deviceCertUpdate'){
      console.log('homePage.deviceCertUpdate', e);
      if( !$.isArray(e.data) || e.data.length==0){
        switchLoginPage(false);
      }
      else {
        var hasSkf = false;

        for (var i=0; i<e.data.length; i++){
          if (e.data[i]['devFrom'].toLowerCase() == 'skf'){
            hasSkf = true;
            break;
          }
        }

        switchLoginPage(hasSkf?'SKF':'CSP');
      }
    }
  };
  
};

/**
 * Created by Jonathan on 2016-12-11.
 */

var certPage = new function () {


  function resetShowCertDetail() {
    $('#cert-issuer').text('');
    $('#cert-serialNumber').text('');
    $('#cert-validDate').text('');
    $('#cert-verify').text("");
  }


  function refreshDevice() {
    app.keyPlugin.readDeviceAndCert(function (deviceCertData) {
      app.notify('deviceCertUpdate', deviceCertData);
    })
  }


  function onDeviceUpdate(deviceCertData) {
    console.log("certPage.onDeviceUpdate", arguments);
    var ukeySelector = $('.ukey-selector'), certSelector = $('.cert-selector');

    ukeySelector.empty();
    certSelector.empty();
    resetShowCertDetail();

    for (var i = 0, deviceCount = deviceCertData.length; i < deviceCount; i++) {
      ukeySelector.append('<option ' + (i == 0 ? 'selected' : '') + ' value="' + deviceCertData[i]['devNickName'] + '">' + deviceCertData[i]['devNickName'] + '</option>')
      if (i == 0) {
        var certs = deviceCertData[i]['certs'];

        for (var j = 0, certCount = certs.length; j < certCount; j++) {
          certSelector.append('<option ' + (i == 0 ? 'selected' : '') + ' value="' + certs[j]['serialNumber'] + '">' + certs[j]['commonName'] + '</option>')
        }
      }
    }
    if (deviceCertData[0] && deviceCertData[0]['certs']){
      certSelector.val(deviceCertData[0]['certs'][0]['serialNumber']).change();
    }
  }


  function showCertDetail(e) {
    e.preventDefault();
    var val = $( ".cert-selector option:selected" ).val();
    console.log('ShowCertButton Clicked: ', val);
    app.keyPlugin.getCert('serialNumber', val, function (cert) {
      app.keyPlugin.showCert(cert);
    });
  }


  function showCertSummary(e) {
    e.preventDefault();
    var val = $( ".cert-selector option:selected" ).val();
    app.keyPlugin.getCert('serialNumber', val, function(cert){
      if (!cert){
        return;
      }

      $('#cert-issuer').text(cert['issuer']);
      $('#cert-serialNumber').text(cert['serialNumber']);
      $('#cert-validDate').text('从 ' +cert['notBefore']+' 至 '+ cert['notAfter']);


      if(0==cert['verify'])
      {
        $('#cert-verify').text("通过").css('color', '#b4ddff');
      }

      if(1 == cert['verify'])
      {
        $('#cert-verify').text("证书不在有效期").css('color', "#d9534f");
      }

      if(2 == cert['verify'])
      {
        $('#cert-verify').text("证书链异常").css('color', "#d9534f");
      }

      if(3 == cert['verify'])
      {
        $('#cert-verify').text("非法用户证书").css('color', "#d9534f");
      }
    });

  }


  this.update = function (e) {
    if (e.name == 'deviceCertUpdate'){
      onDeviceUpdate(e.data);
    }
    else if (e.name == 'keyEject'){
      onDeviceUpdate([]);
    }
  };


  this.init = function () {
    app.register(this);

    $('#show-cert-btn').click(showCertDetail);

    // 选择一个证书后，显示证书 Summary
    $('.cert-selector').change(showCertSummary);


    $('#reload-device').click(refreshDevice);

  };

};

/**
 * Created by Jonathan on 2016-12-11.
 */

var devicePage = new function () {

  function changePassword(){
    var oldPasswd = $('#oldPasswd').val(),
        passwd = $('#passwd').val(),
        confirmPasswd = $('#confirmPasswd').val(),
        device = $('#page-device .ukey-selector').val(),
        hintEl = $('#page-device .form-hint');

    if (!device){
      hintEl.text('请选择一个设备！').addClass('btn btn-danger btn-xs');
      return;
    }
    if (!oldPasswd || !passwd || !confirmPasswd ){
      hintEl.text('原始密码和新密码都不能为空！').addClass('btn btn-danger btn-xs');
      return;
    }
    if (passwd != confirmPasswd ){
      hintEl.text('两次密码不一致！').addClass('btn btn-danger btn-xs');
      return;
    }
    if (oldPasswd.length<6 || oldPasswd.length>15
        || passwd.length<6 || passwd.length>15
        || confirmPasswd.length<6 || confirmPasswd.length>15){
      hintEl.text('6-15位数字或字母！');
      return;
    }

    console.info(device, oldPasswd, passwd)
    // app.keyPlugin.changeDevicePassword(device, oldPasswd, passwd, function(resp){
    //   if (!resp.success){
    //     hintEl.text(resp.msg).addClass('btn btn-danger btn-xs');
    //   }
    // });
  }
  
  
  function refreshDevice() {
    app.keyPlugin.readDeviceAndCert(function (deviceCertData) {
      app.notify('deviceCertUpdate', deviceCertData);
    })
  }

  function onDeviceUpdate(deviceCertData) {
    console.log("devicePage.onDeviceUpdate", arguments);
    var ukeySelector = $('.ukey-selector');
    ukeySelector.empty();
    for (var i = 0, deviceCount = deviceCertData.length; i < deviceCount; i++) {
      ukeySelector.append('<option ' + (i == 0 ? 'selected' : '') + ' value="' + deviceCertData[i]['devNickName'] + '">' + deviceCertData[i]['devNickName'] + '</option>')
    }
  }


  this.update = function (e) {
    if (e.name == 'deviceCertUpdate'){
      onDeviceUpdate(e.data);
    }
    else if (e.name == 'keyEject'){
      onDeviceUpdate([]);
    }
  };


  this.init = function () {
    app.register(this);

    $('#change-password').click(changePassword);

    $('#refresh-device').click(refreshDevice);
  };
  
};

var downloadPage = new function () {
  var timers = [];


  function initList() {
    // we need this 'empty' search to force refresh the downloads list
    // e.g.: find files that were removed
    chrome.downloads.search({limit: 0}, function () {
      chrome.downloads.search(
          {limit: 6, orderBy: ['-startTime']},
          show_downloads_list
      );
    });
  }

  function show_downloads_list(results) {
    var targetDownloading = document.getElementById('downloading');
    var targetDownloaded = document.getElementById('downloaded');
    var htmlDownloading = "";
    var htmlDownloaded = "";

    results.forEach(function (e) {
      if (e.exists) {
        if (e.state == "in_progress") {
          htmlDownloading += downloadingHtml(e);
          if (!e.paused){
            startTimer(e.id);
          }
        } else {
          htmlDownloaded += downloadedHtml(e);
        }
      }
    });

    if (htmlDownloading == '') {
      htmlDownloading = emptyHtml();
    }
    targetDownloading.innerHTML = htmlDownloading;

    if (htmlDownloaded == '') {
      htmlDownloaded = emptyHtml();
    }
    targetDownloaded.innerHTML = htmlDownloaded;
  }

  function startTimer(id) {
    clearInterval(timers[id]);
    function timer() {
      var el = $("#download-" + id);
      var progress = $("#progress-bar-" + id);
      var progressText = $("#process-bar-text-" + id);
      chrome.downloads.search({id: id}, function (results) {
        var e = results[0];
        // download not found (probably deleted or canceled on danger)
        if (!e) {
          clearInterval(timers[id]);
          initList();
          return;
        }

        // show progress metrics (speed, size, progress bar)
        if (e.state != 'complete') {
          // var remaining_seconds = (new Date(e.estimatedEndTime) - new Date()) / 1000;
          // var remaining_bytes = e.totalBytes - e.bytesReceived;
          // var speed = remaining_bytes / remaining_seconds;
          var receivePer = (100 * e.bytesReceived / e.totalBytes).toFixed(1) + "%";
          progress.animate({width: receivePer}, 1);
          progressText.text(receivePer);
        } else {
          // status.innerHTML = "";
          progress.css('width', "100%");
          progressText.text("100%");
          //正在下载删除当前item
          removeItem(id);
          //下载完成添加item
          initList();
          clearInterval(timers[id]);
        }
      });
    }

    timers[id] = setInterval(timer, 1000);
    setTimeout(timer, 1);
  }

  function stopTimer(id) {
    clearInterval(timers[id]);
  }

  function downloadingHtml(e) {
    var imgSrc = './dist/img/file-large.png';
    var stateImg ;
    var stateText ;
    var state;
    var receivePer = (100 * e.bytesReceived / e.totalBytes).toFixed(1) + "%";
    if(e.paused){
      stateImg = './dist/img/continue.png';
      stateText = '继续';
      state = 'resume';
    } else {
      stateImg = './dist/img/pause.png';
      stateText = '暂停';
      state = 'pause';
    }

    chrome.downloads.getFileIcon(e.id, {}, function (icon) {
      if (icon) {
        imgSrc = icon;
      }
    });

    return '<li id="' + e.id + '">' +
        '<div class="left">' +
        '<img src="' + imgSrc + '">' +
        '<div class="item-title">' + e.filename.replace(/^.*[\\\/]/, '') + '</div>' +
        '<div class="progress">' +
        '<div id="progress-bar-' + e.id + '" class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+receivePer+'">' +
        '<span id="process-bar-text-' + e.id + '">'+receivePer+'</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="right">' +
        '<div class="cancel-dw" downloading-id="' + e.id + '"><img src="/dist/img/ex-cancel.png"><span>取消</span></div>' +
        '<div class="downloading-control" downloading-id="' + e.id + '" btn-state="'+state+'"><img src="'+stateImg+'"><span>'+stateText+'</span></div>' +
        '</div>' +
        '</li>'
  }


  function downloadedHtml(e) {
    var imgSrc = './dist/img/file-large.png';
    chrome.downloads.getFileIcon(e.id, {}, function (icon) {
      if (icon) {
        imgSrc = icon;
      }
    });

    var completeTime = new Date(e.endTime);
    return '<li id="' + e.id + '">' +
        '<div class="left">' +
        '<img src="' + imgSrc + '">' +
        '<div class="item-title">' + e.filename.replace(/^.*[\\\/]/, '') + '</div>' +
        '<div>' +
        '<span class="">' + sizeFormat(e.fileSize) + '</span>' +
        '<span class="date">' + completeTime.toLocaleTimeString() + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="right">' +
        '<div class="delete-file" download-id="' + e.id + '"><img src="/dist/img/ex-delete.png"><span>删除</span></div>' +
        '<div class="execute-file" download-id="' + e.id + '"><img src="/dist/img/file.png"><span>打开</span></div>' +
        '<div class="open-dir"><img src="/dist/img/dir.png"><span>文件夹</span></div>' +
        '</div>' +
        '</li>'
  }

  function sizeFormat(fileSize) {
    if (!fileSize) return '0 B';
    if (fileSize > 1024 * 1024 * 1024 * 1024) return (fileSize / 1024 / 1024 / 1024).toFixed(2) + " GB";
    if (fileSize < 1024 * 1024 * 1024) return (fileSize / 1024 / 1024).toFixed(2) + " MB";
    if (fileSize < 1024 * 1024) return (fileSize / 1024).toFixed(2) + " KB";
    return fileSize + " B";
  }

  function time_format(s) {
    if (s < 60) return Math.ceil(s) + " secs";
    if (s < 60 * 5) return Math.floor(s / 60) + " mins " + Math.ceil(s % 60) + " secs";
    if (s < 60 * 60) return Math.ceil(s / 60) + " mins";
    if (s < 60 * 60 * 5) return Math.floor(s / 60 / 60) + " hours " + (Math.ceil(s / 60) % 60) + " mins";
    if (s < 60 * 60 * 24) return Math.ceil(s / 60 / 60) + " hours";
    return Math.ceil(s / 60 / 60 / 24) + " days";
  }

  function emptyHtml() {
    return '<li><div>没有下载内容</div></li>';
  }

  function removeItem(id) {
    var node = document.getElementById(id);
    node.parentNode.removeChild(node);
  }

  function clearAllDownloads() {
    chrome.downloads.search({}, function (results) {
      results.forEach(function (item) {
        chrome.downloads.erase({id: item.id});
      });
    });
    initList();
  }


  function changeState(state, id) {
    var itemId = parseInt(id);
    chrome.downloads[state](itemId);
    if (/resume/.test(state))
      startTimer(itemId);
    else if (/cancel|pause/.test(state))
      stopTimer(itemId);
  }

  this.init = function () {
    chrome.downloads.onCreated.addListener(function () {
      initList();
    });

    chrome.downloads.onChanged.addListener(function (delta) {
      initList();
    });


    //下载管理
    $('#nav-download').click(function () {
      initList();
    });

    $('#downloading').on('click', '.downloading-control', function (e) {
      var id;
      var state;

      if ($(e.target).attr('downloading-id')) {
        id = $(e.target).attr('downloading-id');
        state = $(e.target).attr('btn-state');
      } else {
        id = $(e.target).parent().attr('downloading-id');
        state = $(e.target).parent().attr('btn-state');
      }

      if (/resume|cancel|pause/.test(state)) {
        changeState(state, id);

        if (/resume/.test(state)){
          $('.downloading-control:first-child').attr('src','./dist/img/in.png');
          $('.downloading-control:last-child').text('暂停');
        } else {
          $('.downloading-control:first-child').attr('src','./dist/img/continue.png');
          $('.downloading-control:last-child').text('继续');
        }
      }
    });

    $('#downloading').on('click', '.cancel-dw', function (e) {
      var id;
      if ($(e.target).attr('downloading-id')) {
        id = $(e.target).attr('downloading-id');
      } else {
        id = $(e.target).parent().attr('downloading-id');
      }

      stopTimer(id);
      chrome.downloads.erase({id: parseInt(id)});
      removeItem(id);
    });

    $('#downloaded').on('click', '.execute-file', function (e) {
      var downloadId = '';
      console.log(e);
      if ($(e.target).attr('download-id')) {
        downloadId = $(e.target).attr('download-id');
      } else {
        downloadId = $(e.target).parent().attr('download-id');
      }
      chrome.downloads.open(parseInt(downloadId));
    });

    $('#downloaded').on('click', '.open-dir', function (e) {
      chrome.downloads.showDefaultFolder();
    });

    $('#downloaded').on('click', '.delete-file', function (e) {
      var downloadId = '';
      if ($(e.target).attr('download-id')) {
        downloadId = $(e.target).attr('download-id');
      } else {
        downloadId = $(e.target).parent().attr('download-id');
      }
      chrome.downloads.removeFile(parseInt(downloadId));
      removeItem(downloadId);
    });

    $('#clearAll').click(function () {
      clearAll();
    });
  }
};





/**
 * Created by Jonathan on 2016-12-9.
 */

var nw = require('nw.gui');
var win = nw.Window.get();
// win.setMaximumSize(screen.availWidth+15, screen.availHeight+15);
win.maximize();
win.setResizable(false);
win.show();

nw.App.on('open', function (argString) {
		win.show();
	});

// 配置 toaster 样式
toastr.options = {
  "positionClass": "toast-top-center"
};


$(function(){

  function initWindowControlButtons() {
    $('.btn-close').click(function () {
      win.close();
    });

    $('.btn-resize').click(function () {
      win.restore();
    });

    $('.btn-minimize').click(function () {
      win.minimize();
    });

    $('.btn-maximize').click(function () {
      win.maximize();
    });

    $('.btn-back').click(function (e) {
      e.preventDefault();
      $('#browser')[0].contentWindow.window.history.back();
    });

    $('.btn-forward').click(function (e) {
      e.preventDefault();
      $('#browser')[0].contentWindow.window.history.forward();
    });
  }


  function initTabPages() {
    $('.nav a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');

      // 只有在我的网银页面显示前进后退按钮
      if ( this.hash == '#page-home'){
        $('.nav-control').show();
      } else {
        $('.nav-control').hide();
      }
    });
  }


  function initHome(){
    // $('#browser').prop('src', app.KEY_LOGIN_URL);

    // 在同一iframe中打开新页面
    win.on('new-win-policy', function (frame, url, policy) {
      policy.ignore(); //ignore policy first to prevent popup
      $("#browser").prop("src",url); //load popup url into iFrame
    });
  }


  function initNetwork() {
    $('#cache-checker').change(function () {
      Network.setExitClear(this.checked);
    });

    $('#btn-clear-cache').click(function () {
      Network.clearCache();
    });

    $('#btn-proxy-submit').click(function () {
      var host = $('#host').val(),
          port = $('#port').val(),
          name = $('#name').val(),
          password = $('#password').val();

      if (!host || !port || !name || !password) {
        toastr.warning('代理配置不能为空！');
        return;
      }
      Network.setProxy(host, port, name, password);
    });
  }

  initHome();
  initWindowControlButtons();
  initTabPages();

  app.init();
  homePage.init();
  certPage.init();
  devicePage.init();
  securePage.init();
  downloadPage.init();
});
//# sourceMappingURL=main.js.map
