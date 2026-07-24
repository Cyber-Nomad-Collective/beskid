import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { BookOpen, CheckCircle, GraduationCap, Lightbulb, Play, RotateCcw, TerminalIcon, PanelLeftClose, PanelLeftOpen, LayoutList, FlaskConical } from "lucide-react";
import { Button, Card, Badge, Separator } from "@beskid/ui-react";
import { clsx } from "clsx";
import { learnExercises, validateModeForExercise, type LearnExercise } from "#/data/learningCatalog";
import { AuthGate, UserBadge } from "#/components/AuthGate";
import LessonCard from "#/components/LessonCard";
import ProgressTracker from "#/components/ProgressTracker";
import Playground from "#/components/Playground";
import { LessonEditor } from "#/components/LessonEditor";
import { CodeHighlight } from "#/components/CodeHighlight";
import type { AuthUser } from "#/lib/auth";
import "xterm/css/xterm.css";
import "./styles.css";
type CheckResponse = { exerciseId: string; command: string; exitCode: number; success: boolean; stdout: string; stderr: string; timedOut: boolean; durationMs: number; diagnosticsSummary: string; expectedOutputMatched?: boolean; expectedOutput?: string; error?: string; };

type ViewMode = "lesson" | "playground";

function writeBlock(terminal, lines) { for (var i = 0; i < lines.length; i++) terminal.writeln(lines[i]); }

function parseMultiline(value, label) { return value.split(/\r?\n/).filter(function(l){return l.trim().length>0}).map(function(l){return label+" "+l}); }
function rBL(m){var id="beskid";if(m.languages.getLanguages().some(function(l){return l.id===id}))return;m.languages.register({id:id,aliases:["Beskid"]});m.languages.setLanguageConfiguration(id,{comments:{lineComment:"//"},brackets:[["{","}"],["(",")"],["[","]"]],autoClosingPairs:[{open:"{",close:"}"},{open:"(",close:")"},{open:"[",close:"]"}]});m.languages.setMonarchTokensProvider(id,{tokenizer:{root:["KW_REGEX","TB_REGEX","CM_REGEX","ST_REGEX","CH_REGEX","NM_REGEX"]}});}
function LessonView(props){
  var e=props.exercise, op=props.onPassed, ce=props.canEdit, oe=props.onExerciseUpdated;
  var _a=useState(e.starterCode), code=_a[0], setCode=_a[1];
  var _b=useState(false), running=_b[0], setRunning=_b[1];
  var _c=useState(null), result=_c[0], setResult=_c[1];
  var _d=useState(0), activeHint=_d[0], setActiveHint=_d[1];
  var tr=useRef(null), ts=useRef(null), fa=useRef(new FitAddon());
  useEffect(function(){
    var t=new Terminal({convertEol:true,scrollback:5000,theme:{background:"#101828",foreground:"#e6f0ff",cursor:"#8fb0ff"},fontFamily:"JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:14});
    ts.current=t; t.loadAddon(fa.current);
    if(tr.current) t.open(tr.current); fa.current.fit();
    t.writeln("Beskid Learn terminal ready."); t.writeln("Exercise: "+e.title);
    var rz=function(){fa.current.fit();}; window.addEventListener("resize",rz);
    return function(){window.removeEventListener("resize",rz);t.dispose();};
  },[]);
  useEffect(function(){setCode(e.starterCode);setResult(null);setActiveHint(0);},[e.id]);  var hlr=function(ed,mn){rBL(mn);mn.editor.setModelLanguage(ed.getModel(),"beskid");};
  var rc=function(){
    if(!ts.current||running)return; setRunning(true); var t=ts.current; t.clear();
    writeBlock(t,["Running: "+e.command,"Mode: "+validateModeForExercise(e)]);
    fetch("/api/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({exerciseId:e.id,code:code,command:e.command})})
      .then(function(r){return r.json();})
      .then(function(d){
        setResult(d);
        writeBlock(t,["command: "+d.command,"exitCode: "+String(d.exitCode),"duration: "+d.durationMs+"ms"]);
        if(typeof d.expectedOutput==="string")writeBlock(t,["expected output: "+JSON.stringify(d.expectedOutput),"matched: "+(d.expectedOutputMatched?"yes":"no")]);
        writeBlock(t,parseMultiline(d.diagnosticsSummary,"[summary]"));
        writeBlock(t,parseMultiline(d.stdout,"[stdout]"));
        writeBlock(t,parseMultiline(d.stderr,"[stderr]"));
        writeBlock(t,["-----"]);
        writeBlock(t,[d.success?"Result: PASS":d.error?"Check failed: "+d.error:"Result: FAIL"]);
        if(d.success)op(e.id);
      }).catch(function(err){var m=err instanceof Error?err.message:"Unknown check error";writeBlock(t,["Term request failed:",m]);})
      .finally(function(){setRunning(false);});
  };
  return React.createElement("div",{className:"lesson-view"},
    React.createElement(Card,{className:"lesson-header-card"},
      React.createElement("div",{className:"lesson-header-content"},
        React.createElement("div",null,
          React.createElement("div",{className:"flex items-center gap-2 mb-1"},
            React.createElement(BookOpen,{className:"w-5 h-5 text-primary"}),
            React.createElement("h2",{className:"text-xl font-semibold"},e.title),
            React.createElement(Badge,{variant:"secondary",className:clsx(e.difficulty==="beginner"?"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400":"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400")},e.difficulty)),
          React.createElement("p",{className:"text-muted-foreground text-sm"},e.objective)))),
    e.detailedContent&&React.createElement(Card,{className:"lesson-content-card"},
      React.createElement("div",{className:"lesson-prose",dangerouslySetInnerHTML:{__html:e.detailedContent.replace(/##\s/g,"<h2 class=\"text-lg font-semibold mt-4 mb-2 text-primary\">").replace(/###\s/g,"<h3 class=\"text-base font-semibold mt-3 mb-1 text-foreground/90\">").replace(/```beskid\n([\s\S]*?)```/g,function(_,c){return"<div data-code-sample=\"\">"+c.replace(/</g,"&lt;").replace(/>/g,"&gt;")+"</div>";}).replace(/```(\w*)\n?/g,"<pre class=\"lesson-code-block\"><code>").replace(/```/g,"</code></pre>").replace(/\n- /g,"\n<li class=\"lesson-list-item\">").replace(/\n/g,"<br/>")}})),
    e.hints.length>0&&React.createElement(Card,{className:"hints-card"},
      React.createElement("div",{className:"flex items-center gap-2 mb-3"},
        React.createElement(Lightbulb,{className:"w-4 h-4 text-amber-500"}),
        React.createElement("h3",{className:"text-sm font-semibold"},"Hints"),
        React.createElement(Badge,{variant:"outline",className:"text-xs"},(activeHint+1)+"/"+e.hints.length)),
      React.createElement("div",{className:"hint-content animate-fade-in",key:activeHint},
        React.createElement(CodeHighlight,{language:"beskid"},e.hints[activeHint])),
      React.createElement("div",{className:"flex gap-2 mt-2"},
        React.createElement(Button,{variant:"ghost",size:"xs",disabled:activeHint===0,onClick:function(){setActiveHint(function(h){return h-1;})}},"Prev"),
        React.createElement(Button,{variant:"ghost",size:"xs",disabled:activeHint>=e.hints.length-1,onClick:function(){setActiveHint(function(h){return h+1;})}},"Next"))),
    e.questions.length>0&&React.createElement(Card,{className:"questions-card"},
      React.createElement("h3",{className:"text-sm font-semibold mb-3"},"Check Your Understanding"),
      React.createElement("div",{className:"questions-grid"},
        e.questions.map(function(q){return React.createElement("div",{className:"question-item",key:q.id},
          React.createElement("p",{className:"text-sm font-medium mb-2"},q.text),
          React.createElement("div",{className:"options-list"},
            q.options.map(function(opt,i){return React.createElement("button",{type:"button",className:clsx("option-btn",i===q.correctIndex&&"option-correct"),key:i},
              i===q.correctIndex&&React.createElement(CheckCircle,{className:"w-3.5 h-3.5 text-emerald-500"}),opt);}))))})),
    React.createElement("div",{className:"editor-terminal-grid"},
      React.createElement("div",{className:"editor-pane"},
        React.createElement("div",{className:"editor-toolbar"},
          React.createElement(Badge,{variant:"outline",className:"text-xs"},e.command),
          React.createElement("div",{className:"flex gap-2 ml-auto"},
            React.createElement(Button,{size:"xs",variant:"ghost",onClick:function(){setCode(e.starterCode);}},
              React.createElement(RotateCcw,{className:"w-3.5 h-3.5 mr-1"})," Reset"),
            React.createElement(Button,{size:"sm",onClick:rc,disabled:running},
              React.createElement(Play,{className:"w-3.5 h-3.5 mr-1"})," ",running?"Running...":"Run"))),
        React.createElement(Editor,{height:"400px",defaultLanguage:"beskid",theme:"vs-dark",value:code,onChange:function(v){setCode(v||"");},onMount:hlr,options:{fontFamily:"JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",minimap:{enabled:false},tabSize:2,automaticLayout:true}})),
      React.createElement("div",{className:"terminal-pane"},
        React.createElement("div",{className:"terminal-header"},
          React.createElement(TerminalIcon,{className:"w-3.5 h-3.5"}),
          React.createElement("span",{className:"text-xs"},"Output"),
          result&&React.createElement(Badge,{className:clsx("ml-auto text-xs",result.success?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")},result.success?"PASS":"FAIL")),
        React.createElement("div",{className:"terminal-container",ref:tr}))),
    ce&&React.createElement(LessonEditor,{lesson:e,canEdit:ce,onSaved:oe}));
}
function App(){
  var _a=useState(learnExercises[0]),ae=_a[0],sae=_a[1];
  var _b=useState(function(){try{return JSON.parse(localStorage.getItem("beskid-learn-passed")||"{}");}catch(e){return {};}}),pl=_b[0],spl=_b[1];
  var _c=useState("lesson"),vm=_c[0],svm=_c[1];
  var _d=useState(true),so=_d[0],sso=_d[1];
  useEffect(function(){localStorage.setItem("beskid-learn-passed",JSON.stringify(pl));},[pl]);
  var hp=useCallback(function(eid){spl(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[eid]=true;return n;});},[]);
  var heu=useCallback(function(u){sae(u);},[]);
  var cc=useMemo(function(){return Object.values(pl).filter(Boolean).length;},[pl]);
  var cats=useMemo(function(){
    var m={}; var cl={basics:"Basics",functions:"Functions","control-flow":"Control Flow",parsing:"Parsing",runtime:"Runtime"};
    for(var i=0,le=learnExercises;i<le.length;i++){var ex=le[i];
      if(!m[ex.category])m[ex.category]={label:cl[ex.category]||ex.category,count:0,completed:0};
      m[ex.category].count++; if(pl[ex.id])m[ex.category].completed++;}
    return m;
  },[pl]);
  return React.createElement(AuthGate,null,function(u){
    return React.createElement("div",{className:"learn-shell"},
      React.createElement("header",{className:"learn-header"},
        React.createElement("div",{className:"learn-header-left"},
          React.createElement(GraduationCap,{className:"w-6 h-6 text-primary"}),
          React.createElement("h1",{className:"text-xl font-bold"},"Beskid Learn"),
          vm==="playground"?React.createElement(Badge,null,React.createElement(FlaskConical,{className:"w-3.5 h-3.5 mr-1"})," Playground"):React.createElement(Badge,{variant:"outline",className:"text-xs"},cc+"/"+learnExercises.length+" done")),
        React.createElement("div",{className:"learn-header-right"},
          React.createElement("div",{className:"flex items-center gap-2"},
            React.createElement(Button,{variant:vm==="lesson"?"default":"ghost",size:"sm",onClick:function(){svm("lesson");}},React.createElement(LayoutList,{className:"w-4 h-4 mr-1.5"})," Lessons"),
            React.createElement(Button,{variant:vm==="playground"?"default":"ghost",size:"sm",onClick:function(){svm("playground");}},React.createElement(FlaskConical,{className:"w-4 h-4 mr-1.5"})," Playground"),
            React.createElement(Button,{variant:"ghost",size:"icon-sm",onClick:function(){sso(function(o){return!o;});},"aria-label":so?"Close sidebar":"Open sidebar"},so?React.createElement(PanelLeftClose,{className:"w-4 h-4"}):React.createElement(PanelLeftOpen,{className:"w-4 h-4"}))),
          u&&React.createElement(UserBadge,{user:u}))),
      React.createElement("div",{className:clsx("learn-grid",!so&&"learn-grid--no-sidebar")},
        React.createElement("main",{className:"learn-main"},
          vm==="playground"?React.createElement(Playground,null):React.createElement(LessonView,{exercise:ae,onPassed:hp,canEdit:u!=null&&u.login!=null,onExerciseUpdated:heu})),
        so&&React.createElement("aside",{className:"learn-sidebar"},
          React.createElement(Card,{className:"sidebar-card"},
            React.createElement("h2",{className:"text-sm font-semibold mb-3 flex items-center gap-2"},React.createElement(BookOpen,{className:"w-4 h-4 text-primary"}),"Lessons"),
            React.createElement("div",{className:"lesson-list-scroll"},
              learnExercises.map(function(ex){return React.createElement(LessonCard,{key:ex.id,lesson:ex,isActive:ae.id===ex.id,isCompleted:pl[ex.id]||false,onSelect:function(){sae(ex);svm("lesson");}});}))),
          React.createElement(Separator,null),
          React.createElement(ProgressTracker,{passedLessons:pl,exerciseCount:learnExercises.length,categories:cats}))));
  });
}
export default App;
