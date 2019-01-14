;(function(global, doc, $) {
  // 加载缓存数据
  let data = loadData();
  // main func
  $(doc).ready(function() {
    // 自适应窗口
    resizeApp();
    // 更新初始数据
    updateData();
    // 绑定开始/结束按钮事件
    $('#start-btn').on('click', lotBtnFunc)
    // 绑定总数输入事件
    $('#total').on('change', totalInput)
    // 绑定重置按钮事件
    $('#reset-btn').on('click', resetFunc);
    // 绑定结果按钮事件
    $('#result-btn').on('click', resultSwitch);
    // 绑定foot显示/隐藏
    footOut();
  });

  // 底部鼠标移入
  function footIn() {
    $('#result-btn, #reset-btn').on('mouseout', footOut).off('mouseenter')
    $(this).css({ opacity: 1 });
  }

  // 底部鼠标移出
  function footOut() {
    $('#result-btn, #reset-btn').on('mouseenter', footIn).off('mouseout');
    $(this).css({ opacity: 0 });
  }

  // 抽奖开始
  function lotBtnFunc() {
    const btn = $('#start-btn');
    const sel = $('#pick-num');
    if (btn.attr('class') === 'play') {
      if (!Array.isArray(data.total) || data.total.length === 0) {
        return;
      }
      // 将按钮替换为结束按钮
      btn.attr('class', 'stop');
      // 将开始按钮禁用
      sel.prop('disabled', true);
      // 清空锦鲤池
      $('#board').html('');
      // 开始滚动号码
      $('#lucky-number').addClass('active');
      // 控制杆下拉
      $('#stick').addClass('active');
      // 闪灯加快
      $('#light-white').addClass('active');
      $('#light-red').addClass('active');
    } else if (btn.attr('class') === 'stop') {
      // 临时将按钮设置为禁用 防止连点
      btn.attr('class', 'play').prop('disabled', true);
      // 停止抽奖（将select取消禁用 并将值传入）
      stopLot(sel.prop('disabled', false).val());
    }
  }

  // 号码滚动停止
  function stopLot(num) {
    // 临时抽奖池
    const curr = [];
    for (let i = 0; i < num; i++) {
      const len = data.total.length;
      curr.push(data.total.splice(Math.floor(Math.random() * len), 1)[0]);
    }
    // 更新data中的已抽数据
    data.lot.push(curr.slice());
    // 更新数据
    updateData();
    // 定义递归方法
    const setNum = function() {
      if (curr.length > 0) {
        const n = curr.shift();
        pushToBoard(n);
        setTimeout(function() {
          setNum();
        }, 800);
      } else {
        // 停止数字滚动
        $('#lucky-number').removeClass('active');
        // 恢复灯闪动
        $('#light-white').removeClass('active');
        $('#light-red').removeClass('active');
        // 恢复play按钮
        $('#start-btn').prop('disabled', false);
        // 控制杆恢复
        $('#stick').removeClass('active');
      }
    };
    // 开始执行
    setNum();
  }

  // 总数输入
  function totalInput(e) {
    const v = e.target.value;
    if (/\D/g.test(v)) {
      $('#total').val(0);
    } else {
      $('#total')
        .val(+v)
        .prop('disabled', true);
      data.total = [];
      for (let i = 1; i <= v; i++) {
        data.total.push(i);
      }
      updateData(data);
    }
  }

  // 加载数据
  function loadData() {
    let _data = {
      total: [],
      lot: []
    }
    try {
      // 优先读缓存数据
      _data = JSON.parse(localStorage.getItem('__yc_lot_data__')) || {
        total: [],
        lot: []
      };
    } catch (error) {
      _data = {
        total: [],
        lot: []
      };
    }
    const hasData = _data.total.length !== 0 || _data.lot.length !== 0;
    const totalNum = _data.total.length + _.flatten(_data.lot).length;
    // 总数输入框状态
    $('#total')
      .val(totalNum)
      .prop('disabled', hasData);
    // 开始按钮初始化
    $('#start-btn')
      .prop('disabled', false)
      .attr('class', 'play');
    // 清空结果面板
    $('#board').html('');
    
    return _data;
  }

  // 更新数据
  function updateData(_data) {
    _data = _data || data;
    // 缓存数据
    localStorage.setItem('__yc_lot_data__', JSON.stringify(_data));
    // 配置到结果集
    setResultRow(_data.lot);
    // 更新已抽和剩余
    const haslot = _.flatten(_data.lot);
    console.log(_data)
    const unlot = _data.total;
    $('#number-done').html(haslot.length);
    $('#number-left').html(unlot.length);
  }

  // 重置所有
  function resetFunc() {
    updateData({
      lot: [],
      total: []
    });
    data = loadData();
  }

  // 填充锦鲤池
  function pushToBoard(num) {
    // children最大不可超过12个 
    if ($('#board').children().length < 12) {
      $('#board').append(`<span class="board-num left-in">${num}</span>`)
      return true;
    }
    return false;
  }

  // 填充结果集
  function setResultRow(_data) {
    if (!Array.isArray(_data)) {
      return '';
    }
    $('#result-panel').html(_data.map(function(item, i) {
      return Array.isArray(item) ? `<div class="result-row">
        <span class="result-title">第${i + 1}轮（${item.length}）:</span>
        <span class="result-content">${item.join('、')}</span>
      </div>` : '';
    }).join(''));
  }

  // 查看结果与抽奖面板切换
  function resultSwitch() {
    $('#result-panel').fadeToggle();
    $('#lot-panel').fadeToggle();
  }

  // 调整APP尺寸自适应
  function resizeApp() {
    const appWidth = $('#app').width();
    const appHeight = $('#app').height();
    const screenWidth = global.innerWidth;
    const screenHeight = global.innerHeight;
    const ratio = Math.min(screenWidth / appWidth, screenHeight / appHeight);
    $('#app').css({
      transform: `scale(${ratio}) translateX(-50%)`
    });
  }
})(window, document, jQuery);