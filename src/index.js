const Preview = require('./preview');
import axios from 'axios';
var lodash = require('lodash');

var getKeyWordReg = function (key) {
    return new RegExp('([\\-_\\w\\d\\/\\$]{0,}){0,1}' + key + '([\\-_\\w\\d\\$]{0,}){0,1}', 'gi');
};

var youdao_axios = axios.create({
    baseURL: 'http://fanyi.youdao.com/openapi.do?callback=?&keyfrom=Codelf&key=2023743559&type=data&doctype=json&version=1.1',
    timeout: 10000,
});

var searchcode_axios = axios.create({
    baseURL: 'https://searchcode.com/api/codesearch_I/',
    timeout: 10000,
});

var handle_event = lodash.throttle((search_content,display)=>{
    if (!search_content || search_content.length <=0) {
        return;
    }
    let els = {lastVal:"",valHistory:"",valRegs:[]};
    youdao_axios.get('',{params: {q: search_content }})
        .then(function (response) {
            var youdao_ret = response.data;
            console.log('type is:',typeof youdao_ret);
            var searchcode = youdao_ret.web[0].value[0];
            
            var tdata = response.data;
            if (tdata.basic && tdata.basic.explains) {
                els.valHistory = tdata.basic.explains.join(' ');
            }
            //web translate
            if (tdata.web && tdata.web) {
                tdata.web.forEach(function (key) {
                    els.valHistory += ' ' + key.value.join(' ');
                });
            }
            if (tdata && tdata.translation) {
                els.lastVal = els.lastVal + ' '
                    + tdata.translation.join(' ')
                    .replace(/[!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '')
                    .split(' ').filter(function (key, idx, inputArray) {
                        return inputArray.indexOf(key) == idx && !/^(a|an|the)$/ig.test(key);
                    }).join(' ');
            } else {
            }
            els.lastVal = els.lastVal.trim();
            els.lastVal = els.lastVal.split(' ').filter(function (key, idx, inputArray) {
                return inputArray.indexOf(key) == idx;
            }).join(' ');
            els.valRegs = [];
            els.lastVal.replace(/\s+/ig, '+').split('+').forEach(function (key) {
                key.length && key.length > 1 && els.valRegs.push(getKeyWordReg(key));
            });
            console.log('user codelf convert is:',els);
            console.log('youdao ret is:',searchcode);
            return searchcode_axios.get('/',{
                params:{
                    q:searchcode,
                    p:0,
                    per_page:16,
                }
            });
        })
        .then((response)=>{
            console.log('response is:',response.data.results);

            let data = response.data;
            let lineStr = [];

            var vals = [], labels = [];
            data.results.forEach(function (rkey) {
                //filter codes
                lineStr = [];
                for (var lkey in rkey.lines) {
                    var lstr = rkey.lines[lkey];
                    //no base64
                    if (!(/;base64,/g.test(lstr) && lstr.length > 256)) {
                        // console.log('lstr split is:',lstr.split(/[\-|\/|\ |\(|\)|\>|\,|\[|\]|\*|\&]|\=/));
                        lstr.split(/[\-|\/|\ |\(|\)|\>|\,|\[|\]|\*|\&]|\=|\"|\:|\.|\'|\$|\{|\}/).forEach((value)=>{
                            // console.log('dump split code is:',value);
                            if (value.length && value.length > 0) {
                                els.valRegs.forEach(function (key) {
                                    if (value.match(key)) {
                                        // value = value.replace(/^(\-|\/)*/, '').replace(/(\-|\/)*$/, '');
                                        console.log('lstr match key after replace is:',value.trim());
                                    }
                                });
                            }
                        });
                    }
                }
            });

        }) 
        .catch(function (error) {
            console.log(error);
        });
},3000);

export const fn = ({ term, display }) => {
    // Put your plugin code here
    var split_contents = term.split(" ");
    if(split_contents[0] == 'codelf'){
        // console.log('split contents is:', split_contents);
        var search_contents = lodash.slice(split_contents,1);
        // console.log('search contents:',search_contents.join(" "));
        handle_event(search_contents.join(" "),display);
        // searchcode_axios.get('/?q=array',{
        //     params:{
        //         q:'array',
        //         p:0,
        //         per_page:16,
        //     }
        // })
        // .then((response)=>{
        //     console.log(response);
        //     display({
        //         title: "hicarlos",
        //         getPreview: () => {return response.data;}
        //     });
        // })
        // .catch((response)=>{
        //     console.log(response);
        // }) ;
    }
    

    
};
