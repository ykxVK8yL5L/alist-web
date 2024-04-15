import { useFetch, useT, useRouter, useManageTitle } from "~/hooks"
import { Group, SettingItem, PResp, PEmptyResp, EmptyResp,Type,Flag } from "~/types"
import { r, notify, getTarget, handleResp } from "~/utils"
import { createStore } from "solid-js/store"
import { 
  Button, 
  Input,
  Text,
  Badge,
  HStack, 
  VStack ,
  Select,
  SelectContent,
  SelectIcon,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectPlaceholder,
  SelectTrigger,
  SelectValue
} from "@hope-ui/solid"
import { createSignal,createEffect, Index,For,Show } from "solid-js"
import { Item } from "./SettingItem"
import { ResponsiveGrid } from "../common/ResponsiveGrid"

export interface NotifySettingsProps {
  group: Group
}

interface KeyValueItem {
  label?: string
  value: string
}


interface NotifyItem {
  label: string
  tip: string
  required?: boolean,
  placeholder?:string,
  items?: Array<KeyValueItem>
}

interface NotificationProviders {
  [key: string]: NotifyItem[];
}

type KeyValuePair = {
  [key: string]: any;
};

const notificationModes=[
  { "value": "closed", "label": "已关闭" },
  { "value": "aibotk", "label": "智能微秘书" },
  { "value": "bark", "label": "Bark" },
  { "value": "chat", "label": "群晖chat" },
  { "value": "chronocat", "label": "Chronocat" },
  { "value": "dingtalkBot", "label": "钉钉机器人" },
  { "value": "email", "label": "邮箱" },
  { "value": "goCqHttpBot", "label": "GoCqHttpBot" },
  { "value": "gotify", "label": "Gotify" },
  { "value": "iGot", "label": "IGot" },
  { "value": "lark", "label": "飞书机器人" },
  { "value": "pushDeer", "label": "PushDeer" },
  { "value": "pushMe", "label": "PushMe" },
  { "value": "pushPlus", "label": "PushPlus" },
  { "value": "serverChan", "label": "Server酱" },
  { "value": "telegramBot", "label": "Telegram机器人" },
  { "value": "webhook", "label": "自定义通知" },
  { "value": "weWorkApp", "label": "企业微信应用" },
  { "value": "weWorkBot", "label": "企业微信机器人" }
]


const  notificationModeMap ={
  gotify:[
    {
      label: 'gotifyUrl',
      tip: 'gotify的url地址，例如 https://push.example.de:8080',
      required: true,
    },
    {
      label: 'gotifyToken',
      tip: 'gotify的消息应用token码',
      required: true,
    },
    { label: 'gotifyPriority', tip: '推送消息的优先级'},
  ],
  chat: [
    {
      label: 'chatUrl',
      tip: 'chat的url地址',
      required: true,
    },
    { label: 'chatToken', tip: 'chat的token码', required: true },
  ],
  goCqHttpBot: [
    {
      label: 'goCqHttpBotUrl',
      tip: 
        '推送到个人QQ: http://127.0.0.1/send_private_msg，群：http://127.0.0.1/send_group_msg',
      required: true,
    },
    { label: 'goCqHttpBotToken', tip: '访问密钥', required: true },
    {
      label: 'goCqHttpBotQq',
      tip: 
        '如果GOBOT_URL设置 /send_private_msg 则需要填入 user_id=个人QQ 相反如果是 /send_group_msg 则需要填入 group_id=QQ群',
      required: true,
    },
  ],
  serverChan: [
    {
      label: 'serverChanKey',
      tip: 'Server酱SENDKEY',
      required: true,
    },
  ],
  pushDeer: [
    {
      label: 'pushDeerKey',
      tip: 'PushDeer的Key，https://github.com/easychen/pushdeer',
      required: true,
    },
    {
      label: 'pushDeerUrl',
      tip: 
        'PushDeer的自架API endpoint，默认是 https://api2.pushdeer.com/message/push',
    },
  ],
  bark: [
    {
      label: 'barkPush',
      tip: 
        'Bark的信息IP/设备码，例如：https://api.day.app/XXXXXXXX',
      required: true,
    },
    {
      label: 'barkIcon',
      tip: 'BARK推送图标，自定义推送图标 (需iOS15或以上才能显示)',
    },
    {
      label: 'barkSound',
      tip: 'BARK推送铃声，铃声列表去APP查看复制填写',
    },
    {
      label: 'barkGroup',
      tip: 'BARK推送消息的分组，默认为qinglong',
    },
    {
      label: 'barkLevel',
      tip: 'BARK推送消息的时效性，默认为active',
    },
    {
      label: 'barkUrl',
      tip: 'BARK推送消息的跳转URL',
    },
  ],
  telegramBot: [
    {
      label: 'telegramBotToken',
      tip: 
        'telegram机器人的token，例如：1077xxx4424:AAFjv0FcqxxxxxxgEMGfi22B4yh15R5uw',
      required: true,
    },
    {
      label: 'telegramBotUserId',
      tip: 'telegram用户的id，例如：129xxx206',
      required: true,
    },
    { label: 'telegramBotProxyHost', tip: '代理IP'},
    { label: 'telegramBotProxyPort', tip: '代理端口'},
    {
      label: 'telegramBotProxyAuth',
      tip: 
        'telegram代理配置认证参数，用户名与密码用英文冒号连接 user:password',
    },
    {
      label: 'telegramBotApiHost',
      tip: 'telegram api自建的反向代理地址，默认tg官方api',
    },
  ],
  dingtalkBot: [
    {
      label: 'dingtalkBotToken',
      tip: 
        '钉钉机器人webhook token，例如：5a544165465465645d0f31dca676e7bd07415asdasd',
      required: true,
    },
    {
      label: 'dingtalkBotSecret',
      tip: 
        '密钥，机器人安全设置页面，加签一栏下面显示的SEC开头的字符串',
    },
  ],
  weWorkBot: [
    {
      label: 'weWorkBotKey',
      tip: 
        '企业微信机器人的webhook(详见文档 https://work.weixin.qq.com/api/doc/90000/90136/91770)，例如：693a91f6-7xxx-4bc4-97a0-0ec2sifa5aaa',
      required: true,
    },
    {
      label: 'weWorkOrigin',
      tip: '企业微信代理地址',
    },
  ],
  weWorkApp: [
    {
      label: 'weWorkAppKey',
      tip: 
        'corpid、corpsecret、touser(注:多个成员ID使用|隔开)、agentid、消息类型(选填，不填默认文本消息类型) 注意用,号隔开(英文输入法的逗号)，例如：wwcfrs,B-76WERQ,qinglong,1000001,2COat',
      required: true,
    },
    {
      label: 'weWorkOrigin',
      tip: '企业微信代理地址',
    },
  ],
  aibotk: [
    {
      label: 'aibotkKey',
      tip: 
        '密钥key，智能微秘书个人中心获取apikey，申请地址：https://wechat.aibotk.com/signup?from=ql',
      required: true,
    },
    {
      label: 'aibotkType',
      tip: '发送的目标，群组或者好友',
      required: true,
      placeholder: '请输入要发送的目标',
      items: [
        { value: 'room', label: '群聊'},
        { value: 'contact', label: '好友'},
      ],
    },
    {
      label: 'aibotkName',
      tip: 
        '要发送的用户昵称或群名，如果目标是群，需要填群名，如果目标是好友，需要填好友昵称',
      required: true,
    },
  ],
  iGot: [
    {
      label: 'iGotPushKey',
      tip: 
        'iGot的信息推送key，例如：https://push.hellyw.com/XXXXXXXX',
      required: true,
    },
  ],
  pushPlus: [
    {
      label: 'pushPlusToken',
      tip: 
        '微信扫码登录后一对一推送或一对多推送下面的token(您的Token)，不提供PUSH_PLUS_USER则默认为一对一推送，参考 https://www.pushplus.plus/',
      required: true,
    },
    {
      label: 'pushPlusUser',
      tip: 
        '一对多推送的“群组编码”（一对多推送下面->您的群组(如无则创建)->群组编码，如果您是创建群组人。也需点击“查看二维码”扫描绑定，否则不能接受群组消息推送）',
    },
  ],
  lark: [
    {
      label: 'larkKey',
      tip: 
        '飞书群组机器人：https://www.feishu.cn/hc/zh-CN/articles/360024984973',
      required: true,
    },
  ],
  email: [
    {
      label: 'emailService',
      tip: 
        '邮箱服务名称，比如126、163、Gmail、QQ等，支持列表https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json',
      required: true,
    },
    { label: 'emailUser', tip: '邮箱地址', required: true },
    { label: 'emailPass', tip: 'SMTP 登录密码，也可能为特殊口令，视具体邮件服务商说明而定', required: true },
  ],
  pushMe: [
    {
      label: 'pushMeKey',
      tip: 'PushMe的Key，https://push.i-i.me/',
      required: true,
    },
  ],
  chronocat: [
    {
      label: 'chronocatURL',
      tip: 
        'Chronocat Red 服务的连接地址 https://chronocat.vercel.app/install/docker/official/',
      required: true,
    },
    {
      label: 'chronocatQQ',
      tip: 
        '个人:user_id=个人QQ 群则填入group_id=QQ群 多个用英文;隔开同时支持个人和群 如：user_id=xxx;group_id=xxxx;group_id=xxxxx',
      required: true,
    },
    {
      label: 'chronocatToken',
      tip: 
        'docker安装在持久化config目录下的chronocat.yml文件可找到',
      required: true,
    },
  ],
  webhook: [
    {
      label: 'webhookMethod',
      tip: '请求方法',
      required: true,
      items: [{ value: 'GET' }, { value: 'POST' }, { value: 'PUT' }],
    },
    {
      label: 'webhookContentType',
      tip: '请求头Content-Type',
      required: true,
      items: [
        { value: 'text/plain' },
        { value: 'application/json' },
        { value: 'multipart/form-data' },
        { value: 'application/x-www-form-urlencoded' },
      ],
    },
    {
      label: 'webhookUrl',
      tip: 
        '请求链接以http或者https开头。url或者body中必须包含$title，$content可选，对应api内容的位置',
      required: true,
      placeholder: 'https://xxx.cn/api?content=$title\n',
    },
    {
      label: 'webhookHeaders',
      tip: '请求头格式Custom-Header1: Header1，多个换行分割',
      placeholder: 'Custom-Header1: Header1\nCustom-Header2: Header2',
    },
    {
      label: 'webhookBody',
      tip: 
        '请求体格式key1: value1，多个换行分割。url或者body中必须包含$title，$content可选，对应api内容的位置',
      placeholder: 'key1: $title\nkey2: $content',
    },
  ],
}
const NotifySettings = (props: NotifySettingsProps) => {
  const t = useT()
  const { pathname } = useRouter()
  useManageTitle(`manage.sidemenu.${pathname().split("/").pop()}`)
  const [settingsLoading, getSettings] = useFetch(
    (): PResp<SettingItem[]> =>
      r.get(`/admin/setting/list?group=${props.group}`),
  )
  const [settings, setSettings] = createStore<SettingItem[]>([])
  const [fields, setFields] = createStore<any[]>([]);
  const [notifyInfo, setNotifyInfo] = createStore<KeyValuePair>({});


  const refresh = async () => {
    const resp = await getSettings()
    handleResp(resp, setSettings)
    notificationModeChange(settings[1].value)
    setNotifyInfo(JSON.parse(settings[2].value))
  }
  refresh()
  const [saveLoading, saveSettings] = useFetch(
    (): PEmptyResp => r.post("/admin/setting/save", getTarget(settings)),
  )
  const [loading, setLoading] = createSignal(false)
  const notificationModeChange = (value: string) => {
    setSettings((i) => settings[1].key === i.key, "value", value);
    const _fields = (notificationModeMap as any)[value];
    setFields(_fields || []);
  };

 
  const updateForm = (key:string,value: string) => {
    setNotifyInfo(key,value)
    const notifyValue = JSON.stringify(notifyInfo)
    setSettings((i) => settings[2].key === i.key, "value", notifyValue);
  };

  return (
    <VStack w="$full" alignItems="start" spacing="$2">
      <ResponsiveGrid>

          <Item
          {...settings[0]}
          onChange={(val) => {
            setSettings((i) => settings[0].key === i.key, "value", val)
          }}
          onDelete={async () => {
            setLoading(true)
            const resp: EmptyResp = await r.post(
              `/admin/setting/delete?key=${settings[0].key}`,
            )
            setLoading(false)
            handleResp(resp, () => {
              notify.success(t("global.delete_success"))
              refresh()
            })
          }}
        />
        <Select
            id={settings[1]?.key}
            defaultValue={settings[1]?.value}
            value={settings[1]?.value}
            onChange={(e) => notificationModeChange(e)}
            readOnly={settings[1]?.flag === Flag.READONLY}
          >
            <SelectTrigger>
              <SelectPlaceholder>{t("global.choose")}</SelectPlaceholder>
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectListbox>
                <For each={notificationModes}>
                  {(item) => (
                    <SelectOption value={item.value}>
                      <SelectOptionText>
                        {t(`${item.label}`)}
                      </SelectOptionText>
                      <SelectOptionIndicator />
                    </SelectOption>
                  )}
                </For>
              </SelectListbox>
            </SelectContent>
          </Select>
          {fields.map((x) => (
                  <Show
                      when={x.items}
                      fallback={() =>  {
                            return <><Text mb="$2">{x.label}<Show when={x.required}><Badge colorScheme="danger">*</Badge></Show></Text><Input value={notifyInfo[x.label]} onChange={(e) => updateForm(x.label,e.currentTarget.value)} name={x.label} placeholder={x.placeholder ? x.placeholder : x.tip}/></>
                      }}
                    >
                      
                    <Text mb="$2">{x.label}<Show when={x.required}><Badge colorScheme="danger">*</Badge></Show></Text>
                      <Select onChange={(e) => updateForm(x.label,e)} value={notifyInfo[x.label]}>
                        <SelectTrigger>
                          <SelectPlaceholder>{x.placeholder||x.tip}</SelectPlaceholder>
                          <SelectValue />
                          <SelectIcon />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectListbox>
                          {x.items.map((y) => (
                              <SelectOption value={y.value}>
                                <SelectOptionText>{y.label||y.value}</SelectOptionText>
                                <SelectOptionIndicator />
                              </SelectOption>
                          ))}
                          </SelectListbox>
                        </SelectContent>
                      </Select>
                  </Show>

          ))}
      </ResponsiveGrid>
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          onClick={refresh}
          loading={settingsLoading() || loading()}
        >
          {t("global.refresh")}
        </Button>
        <Button
          loading={saveLoading()}
          onClick={async () => {
            const resp = await saveSettings()
            handleResp(resp, () => notify.success(t("global.save_success")))
          }}
        >
          {t("global.save")}
        </Button>
      </HStack>
    </VStack>
  )
}

export default NotifySettings
