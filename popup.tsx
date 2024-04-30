import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Providers } from "~components/Providers"
import logo from 'url:~assets/logo.png'
import { useForm } from "react-hook-form"
import cn from 'classnames'
import { t } from "~utils"

const PORT = 6143

function IndexPopup() {


  const [saved, setSaved] = useState<boolean>(false)
  const [shouldLaunchApp, setShouldLaunchApp] = useState<boolean>(true)

  const form = useForm({
    defaultValues: {
      collectionId: "",
      title: ""
    }
  })

  const popupQuery = useQuery({
    queryKey: ['popup'],
    queryFn: async () => {
      // get current tab documnent html
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const tabId = tab.id!
      const tabUrl = tab.url
      const tabDocument = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return document.documentElement.outerHTML
        }
      })
      const html = tabDocument[0].result

      form.setValue("title", tab.title || "")

      return {
        page: {
          title: tab.title,
          url: tabUrl,
          html
        },
      }
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (body: {
      collectionId: string,
    }) => {
      if (!popupQuery.data) {
        return
      }

      localStorage.setItem("collectionId", body.collectionId)

      const response = await fetch(`http://localhost:${PORT}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          html: popupQuery.data.page.html,
          collectionId: body.collectionId,
          url: popupQuery.data.page.url,
          title: popupQuery.data.page.title
        })
      })

      const status = response.status

      if (status !== 200) {
        const result = await response.text()
        throw new Error(result)
      } else {
        const result = await response.json()
        return result
      }
    },
    onSuccess() {
      setSaved(true)
    },
    onError(e) {
      alert(e.message)
    }
  })

  const collectionsQuery = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/collections`)
        const result = await response.json()
        setShouldLaunchApp(false)
        const ret = result.data
        const previousCollectionId = localStorage.getItem("collectionId")
        if (previousCollectionId && ret.find(_ => _.id === previousCollectionId)) {
          form.setValue("collectionId", previousCollectionId)
        } else {
          form.setValue("collectionId", ret[0].id || "")
        }
        return ret
      } catch (e) {
        setShouldLaunchApp(true)
      }
    },
  })

  return (
    <div className="w-[300px]" data-theme="lofi">
      <div>
        <div className="p-3 flex items-center gap-3">
          <img src={logo} className="w-[48px]" alt="" />
          <h2 className=" font-bold">EpubKit Connect</h2>
        </div>

        <div className="px-6 pb-6">



          {saved ? <>
            <div className="text-xl text-center">
              {t("saved")}!
            </div>
          </> : <>
            {shouldLaunchApp ? <div className="text-center">
              {t("launchTips")}
            </div> : <>
              <form onSubmit={form.handleSubmit(values => {
                saveMutation.mutate(values)
              })}>
                <div className="space-y-3">
                  <label className="input input-bordered input-sm flex items-center gap-2">
                    <span className=" text-base-content/60">{t("title")}</span>
                    <input autoFocus type="text" {...form.register("title")} className="grow" placeholder="text-base-content Page title" />
                  </label>
                  <select {...form.register("collectionId")} className="select select-bordered select-sm w-full">
                    {collectionsQuery.data?.map((collection) => {
                      return (
                        <option key={collection.id} value={collection.id}>
                          {collection.title}
                        </option>
                      )
                    })}
                  </select>
                  <button type="submit" disabled={saveMutation.isPending} className="w-full btn btn-sm btn-primary">
                    <span className={cn({
                      "loading-spinner loading": saveMutation.isPending
                    })}></span>
                    {t("save")}
                  </button>
                </div>
              </form>
            </>}

          </>}


        </div>
      </div>
    </div>
  )
}

export default function () {
  return (
    <Providers>
      <IndexPopup />
    </Providers>
  )
}
