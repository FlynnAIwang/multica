"use client";

import {
  IssueAgentActivityIndicator,
} from "../../issues/components/issue-agent-activity-indicator";
import { ActorAvatar } from "../../common/actor-avatar";
import { DeferredTooltip } from "../../common/deferred-tooltip";
import { Archive, ArchiveRestore } from "@multica/ui/icons";
import type { InboxItem } from "@multica/core/types";
import type { InboxView } from "./inbox-view";
import { InboxDetailLabel, useTypeLabels } from "./inbox-detail-label";
import {
  getInboxDisplayTitle,
  isAutopilotQuotaNotice,
} from "./inbox-display";
import { useInboxContextMenu } from "./inbox-context-menu";
import { useStatusLabel } from "../../issues/utils/status-label";
import { InboxRowMenu } from "./inbox-row-menu";
import { handleRowActivationKey } from "../../common/row-actions-menu";
import { useT } from "../../i18n";
import { paths, useWorkspaceSlug } from "@multica/core/paths";
import { resolveClickIntent, useIntentNavigate } from "../../navigation";

// Hook returning a localized relative-time formatter — the i18n equivalent
// of the previous static `timeAgo` function. Returning a function (rather
// than a string) keeps call-site usage identical: `timeAgo(dateStr)`.
export function useTimeAgo() {
  const { t } = useT("inbox");
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t(($) => $.list.time.just_now);
    if (minutes < 60) return t(($) => $.list.time.minutes, { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t(($) => $.list.time.hours, { count: hours });
    const days = Math.floor(hours / 24);
    return t(($) => $.list.time.days, { count: days });
  };
}

export function InboxListItem({
  item,
  view,
  isSelected,
  onClick,
  onAction,
}: {
  item: InboxItem;
  view: InboxView;
  isSelected: boolean;
  onClick: () => void;
  // Archive in the main list, unarchive in the archived one — the row action is
  // always the reversal of the current view, so the two lists share this row.
  onAction: () => void;
}) {
  const { t } = useT("inbox");
  const timeAgo = useTimeAgo();
  const typeLabels = useTypeLabels();
  // Inbox is a cross-workspace surface, so the catalog is read against the
  // item's OWN workspace rather than the route's. (MUL-6243)
  const statusLabelOf = useStatusLabel(item.workspace_id);
  const openContextMenu = useInboxContextMenu();
  // Null-safe slug (not useWorkspacePaths, which throws): the row renders in
  // tests and could render outside a workspace route; without a slug the
  // modifier-click affordance simply stays off.
  const slug = useWorkspaceSlug();
  const issueHref =
    slug && item.issue_id
      ? paths.workspace(slug).issueDetail(item.issue_id)
      : null;
  const intentNavigate = useIntentNavigate();
  const displayTitle = isAutopilotQuotaNotice(item.type)
    ? typeLabels[item.type]
    : getInboxDisplayTitle(item);
  const isArchivedView = view === "archived";
  // Archiving deliberately leaves `read` untouched so unarchiving restores the
  // real unread state, so archived rows would otherwise keep an unread marker
  // the user cannot clear from this view. Suppress the affordance here only.
  const showUnread = item.read !== true && !isArchivedView;
  const ActionIcon = isArchivedView ? ArchiveRestore : Archive;
  const actionLabel = isArchivedView
    ? t(($) => $.list.unarchive_tooltip)
    : t(($) => $.list.archive_tooltip);
  const actorType = item.actor_type ?? item.recipient_type;
  // 稳卖 (business-user simplification): a status-change notification used to
  // print "状态设为 ◐ 进行中" on the detail line AND repeat the same status as a
  // coloured glyph on the right. The status now appears once, as plain text,
  // so the detail line is dropped for this type.
  const showDetail = item.type !== "status_changed";

  return (
    // A div, not a <button>: the row carries its own controls (the action
    // button, the compact menu), and interactive descendants of a <button>
    // are invalid HTML that screen readers cannot reach. `role="button"` plus
    // the Enter/Space handler keeps the row's own keyboard behavior.
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Plain click keeps the master-detail selection; a modifier click on
        // a row that references an issue opens that issue as its own tab.
        if (issueHref) {
          const intent = resolveClickIntent(e);
          if (intent !== "push") {
            intentNavigate(issueHref, intent);
            return;
          }
        }
        onClick();
      }}
      onKeyDown={(e) => handleRowActivationKey(e, onClick)}
      onAuxClick={(e) => {
        if (e.defaultPrevented || e.button !== 1 || !issueHref) return;
        e.preventDefault();
        intentNavigate(issueHref, "background-tab");
      }}
      // Right-click opens the list's shared menu (mark read/unread, archive).
      // `select-none` mirrors what Base UI's own trigger used to merge in, so
      // right-clicking a row never starts a text selection.
      onContextMenu={
        openContextMenu ? (e) => openContextMenu(item, e) : undefined
      }
      className={`group flex w-full cursor-default select-none items-center gap-2.5 rounded-md px-2 py-2.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
        isSelected
          ? "bg-accent"
          : "hover:bg-accent/50 data-[popup-open]:bg-accent/50"
      }`}
    >
      <ActorAvatar
        actorType={actorType}
        actorId={item.actor_id ?? item.recipient_id}
        size="lg"
        enableHoverCard
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {showUnread && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            )}
            <span
              className={`truncate text-body ${showUnread ? "font-medium" : "text-muted-foreground"}`}
            >
              {displayTitle}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {/* Pointer-only affordance: revealed on hover, and on keyboard
                focus anywhere in the row so it is reachable by Tab. Touch has
                neither, so it stays hidden on a pointer that cannot hover and
                the compact menu below carries the same action. */}
            <DeferredTooltip
              content={actionLabel}
              trigger={
                <button
                  type="button"
                  aria-label={actionLabel}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction();
                  }}
                  className="hidden rounded-xs p-0.5 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring [@media(hover:hover)]:group-hover:inline-flex [@media(hover:hover)]:group-focus-within:inline-flex"
                >
                  <ActionIcon className="h-3.5 w-3.5" />
                </button>
              }
            />
            <InboxRowMenu item={item} view={view} />
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          {/* 稳卖: "an agent is on this" leads the detail line, left-aligned,
              so it is the first thing read after the title. Badge only, no
              hover card (MUL-5189). */}
          <div className="flex min-w-0 items-center gap-1.5">
            {item.issue_id && (
              <IssueAgentActivityIndicator
                issueId={item.issue_id}
                hoverCard={false}
              />
            )}
            {showDetail && (
              <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-caption text-muted-foreground">
                <InboxDetailLabel item={item} />
              </p>
            )}
          </div>
          {/* 稳卖: the issue's progress is written out ("进行中", "待验收")
              instead of a coloured progress-ring glyph, which first-time
              business users could not decode. */}
          <div className="flex shrink-0 items-center gap-1 text-caption text-muted-foreground">
            {item.issue_status && (
              <>
                <span data-testid="inbox-status-text">
                  {statusLabelOf(item.issue_status)}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
