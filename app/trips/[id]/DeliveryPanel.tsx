"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourierJob, DeliveryResolutionAction } from "@/lib/courier";
import { resolveDeliveryAction, revokeDeliveryTrackingAction } from "./actions";

export function DeliveryPanel({ job, canOperate }: { job: CourierJob; canOperate: boolean }) {
  const [reason, setReason] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false), [pending, setPending] = useState(false);
  const requestId = useRef<string | null>(null), saving = useRef(false);
  const router = useRouter();
  const action: DeliveryResolutionAction | null = job.status === 'delivery_review' ? 'approve_delivery' : job.status === 'return_review' ? 'confirm_return' : job.status === 'support_required' ? (['accepted', 'arrived'].includes(job.incident?.previousStatus ?? '') ? 'cancel_before_pickup' : 'return_to_sender') : null;
  const label = { approve_delivery: 'Confirm delivery after photo review', confirm_return: 'Confirm package returned', return_to_sender: 'Return to original pickup', cancel_before_pickup: 'Cancel before pickup' };
  const needsConfirmation = action === 'approve_delivery' || action === 'confirm_return' || action === 'cancel_before_pickup';
  async function submit(revoke = false) {
    if (!canOperate || saving.current || reason.trim().length < 5 || !revoke && (!action || needsConfirmation && !confirmed)) return;
    saving.current = true; setPending(true); setError(''); setMessage('');
    requestId.current ??= crypto.randomUUID();
    try {
      const result = revoke ? await revokeDeliveryTrackingAction(job.id, reason.trim()) : await resolveDeliveryAction(job.id, { action: action!, requestId: requestId.current, reason: reason.trim(), refundConfirmed: ['confirm_return', 'cancel_before_pickup'].includes(action!) && confirmed });
      if (!result.ok) throw new Error(result.error);
      setReason(''); setConfirmed(false); requestId.current = null;
      setMessage(revoke ? 'Receiver tracking access revoked.' : 'Delivery outcome saved.'); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save the delivery outcome. Refresh and retry.'); }
    finally { saving.current = false; setPending(false); }
  }
  const date = (stamp: number) => new Date(stamp).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' });
  return <section className="rounded-2xl border border-border bg-background p-6 shadow-card space-y-5">
    <h2 className="text-lg font-semibold">Package delivery</h2>
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div><dt className="text-muted-foreground">Receiver</dt><dd>{job.package.receiver.name}<br/>{job.package.receiver.phone}<br/>{job.package.receiver.email}</dd></div>
      <div><dt className="text-muted-foreground">Package</dt><dd>{job.package.size}<br/>{job.package.notes || 'No notes'}</dd></div>
      <div><dt className="text-muted-foreground">Cash collection</dt><dd>{job.package.payer} pays · ₦{((job.collection?.amountMinor ?? 0) / 100).toLocaleString()}<br/>{job.collection?.collectedAt ? `Confirmed ${date(job.collection.collectedAt)} WAT` : 'Not confirmed'}</dd></div>
      <div><dt className="text-muted-foreground">Receiver email</dt><dd>{job.receiverEmailStatus?.status ?? 'pending'} · {job.receiverEmailStatus?.attempts ?? 0} attempts</dd></div>
    </dl>
    {job.incident && <p className="text-sm">Reported problem: {job.incident.reason}</p>}
    <div className="flex flex-wrap gap-4 text-sm">
      {job.pickupProof?.photoUrl && <a href={job.pickupProof.photoUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Review pickup photo</a>}
      {job.deliveryProof?.photoUrl && <a href={job.deliveryProof.photoUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Review {job.status === 'return_review' || job.status === 'returned' ? 'return' : 'delivery'} photo</a>}
    </div>
    {job.deliveryProof?.reason && <p className="text-sm">PIN fallback reason: {job.deliveryProof.reason}</p>}
    {canOperate && <div className="space-y-3 border-t border-border pt-5">
      {action && <p className="text-sm">{action === 'return_to_sender' ? 'Confirm contact with the sender and rider. The package must return to its original pickup. No extra fee is charged automatically.' : action === 'confirm_return' ? 'Confirm the sender has received the parcel. Any collected cash must be refunded before closing this delivery.' : action === 'approve_delivery' ? 'Review the photo and confirm handover with the receiver before completing this delivery.' : 'Confirm the rider has not picked up the parcel and any cash already collected has been returned.'}</p>}
      <label className="block text-sm">Reason / support findings<textarea className="mt-2 w-full rounded-xl border border-border bg-background p-3" minLength={5} maxLength={500} rows={3} disabled={pending} value={reason} onChange={e => { setReason(e.target.value); requestId.current = null; }}/></label>
      {needsConfirmation && <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={pending} onChange={e => { setConfirmed(e.target.checked); requestId.current = null; }}/>{action === 'approve_delivery' ? 'I reviewed the photo and confirmed handover with the receiver.' : 'Any collected cash has been refunded to the payer; no refund remains outstanding.'}</label>}
      <div className="flex flex-wrap gap-3">{action && <button type="button" disabled={pending || reason.trim().length < 5 || needsConfirmation && !confirmed} className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm disabled:opacity-50" onClick={() => submit()}>{pending ? 'Saving…' : label[action]}</button>}
      <button type="button" disabled={pending || reason.trim().length < 5} className="rounded-xl border border-border px-4 py-3 text-sm disabled:opacity-50" onClick={() => submit(true)}>Revoke receiver tracking</button></div>
    </div>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}
    <details className="text-sm"><summary className="cursor-pointer font-medium">Delivery activity</summary><ol className="mt-3 space-y-2">{Object.entries(job.events ?? {}).sort((a,b) => a[1].at - b[1].at).map(([id, e]) => <li key={id}>{e.status.replaceAll('_', ' ')} · {date(e.at)} WAT</li>)}</ol>{Object.entries(job.resolutions ?? {}).map(([id, r]) => <p className="mt-3" key={id}>{r.action.replaceAll('_', ' ')}: {r.reason} · {r.actorId}</p>)}</details>
  </section>;
}
